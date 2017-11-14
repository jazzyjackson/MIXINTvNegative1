#!/usr/local/bin/node
process.platform.includes('win32') && process.exit(console.log("Please start me on something unixy."))
var os          = require('os')
var fs          = require('fs')
var bookkeeper  = require('./bookkeeper')
var inspect    = require('util').inspect
var spawn       = require('child_process').spawn
var figjam      = chooseFigJam()
var key, cert
var subprocess_registry = {}
/* try to read key and certificate from disk and enable HTTPS if true */
var SSL_READY  = trySSL(key, cert)       
/* check if private key and certificate were read properly and start server  */ 
require(SSL_READY ? 'https' : 'http')
.createServer(SSL_READY && {key: key, cert: cert})
.on('request', function(req,res){  
    /* recursive ternary tests conditions until success */
    /event-stream/.test(req.headers.accept)           ? subscribe2events(req,res) : /* from new EventSource (SSE) */
    /\/(?=\?|$)/.test(req.url) && req.method == 'GET' ? figjam(req,res)           : /* url path w/ trailing slash */
    req.method == 'GET'                               ? streamFile(req,res)       :
    req.method == 'PUT'                               ? saveBody(req,res)         :
    req.method == 'POST'                              ? streamSubProcess(req,res) :
    req.method == 'DELETE'                            ? deleteFile(req,res)       :
    res.end(req.method + ' ' + req.url + " Doesn't look like anything to me")     ;
})
.listen(process.argv[2] || 3000)       
.on('listening', function(){ console.log(this.address().port) })

/* start listening on port 3000 unless another number was passed as argument */
/* once the server is listening, print the port number to stdout             */
/* switchboard will request port 0, which assigns a random, unused port      */

/************************************* Function definitions to fulfill requests **************************************/

function forkProcess(request){
    var workingDirectory = process.cwd() + request.url.split('/').slice(0,-1).join('/')
    var command = decodeURIComponent(request.url.split('?')[1])
    // this could read an environment variable that forces you to talk to bot
    // bot could be programmed to post to server as its own user and get a pid back
    // user could then subscribe to pid for updates... hmmmm
    // switchboard would have to provide a way to address processes
    var subprocess = spawn('sh', ['-c', command], { cwd: workingDirectory })
    subprocess_registry[String(subprocess.pid)] = subprocess

    subprocess.on('close', () => {
        delete subprocess_registry[subprocess.pid] //forgeddaboutit
    })
    
    return subprocess
}

function messageProcess(pid, command){
    console.log("PID", pid)
    console.log("Command", JSON.stringify(command + os.EOL))
    // I'm assuming that piping to stdin of a nonexistant process will fail right away, messageProcess should be called in a try/catch block
    subprocess_registry[pid].stdin.write(command + os.EOL) // there is an option to have a callback if the write throws errors, but I'm only anticipating errors when the subprocess doesn't exist.
}

function streamFile(request, response){
    /* response.setHeader('x-githash', process.env.githash) // send metadata about what version of a file was requested */
    fs.createReadStream(decodeURIComponent(request.url.split('?')[0].slice(1)))
    .on('error', function(err){ response.writeHead(500); response.end( JSON.stringify(err)) })
    .pipe(response)
}

function saveBody(request, response){
    /* might automatically launch git commit here... */
    request.pipe(fs.createWriteStream('.' + decodeURIComponent(request.url), 'utf8'))
    .on('finish', function(){ response.writeHead(201); response.end() })
    .on('error', function(err){ response.writeHead(500); response.end( JSON.stringify(err)) })
}

function deleteFile(request, response){
    fs.unlink('.' + decodeURIComponent(request.url), function(err){ 
        response.writeHead( err ? 500 : 204); 
        response.end(JSON.stringify(err))
    })
}

function streamSubProcess(request, response){
    // if the request is for an ongoing process, it will carry a x-for-pid header
    // processes started previously 
    // processes are registered per operator, so in a multi-user enviornment, users can't try to send messages (control chars etc) to other users' processes
    if(request.headers && request.headers["x-for-pid"]){
        try {
            messageProcess(request.headers["x-for-pid"], decodeURIComponent(request.url.split('?')[1]))
            response.writeHead(204)
            return response.end()
        } catch(err){
            response.writeHead(500)
            return response.end(inpsect(err))
        }
    }
    
    var subprocess = forkProcess(request)
    /* check for pid in parameters, pipe body to existing process if available, else throw 'no process with that pid' */
    response.setHeader('Content-Type', 'application/octet-stream')
    response.setHeader('Trailer', 'Exit-Code') // not really supported by anyone yet, but it will be useful once browsers can read trailers.

    subprocess.on('error', function(err){ 
        response.writeHead(500); 
        response.end(JSON.stringify(err)) 
    })

    subprocess.stdout.pipe(response, {end: false}) // end: false - don't close pipe on receiving null bytes
    subprocess.stderr.pipe(response, {end: false})

    subprocess.on('close', (code,signal) => {
        response.addTrailers({'Exit-Code': code || signal})
        response.end()
    })    
}

function subscribe2events(request, response){
    response.setHeader('Content-Type', 'text/event-stream')
    var pushEvent = function(name,data){
        response.write(['event: ', name, '\n',
                        'data: ', data ? JSON.stringify(data) : '', '\n',
                        '\n'].join(''))
    }

    /* start the subprocess and send the pid to client */
    var subprocess = forkProcess(request)
    
    pushEvent('pid', subprocess.pid)
    /* start sending an empty heartbeat event every 15 seconds until process closes, to keep connection open */
    var heartbeat = setInterval(function(){pushEvent(':heartbeat')},15000)
    /* push error, data, and close events from the subprocess */
    subprocess.on('error', function(error){ pushEvent('error', error) })
    subprocess.stdout.on('data', function(data){ pushEvent('stdout',data.toString()) })
    subprocess.stderr.on('data', function(data){ pushEvent('stderr',data.toString()) })
    subprocess.on('close', (code,signal) => {
        clearInterval(heartbeat) // stop trying to send heartbeats
        pushEvent('close', {code: code, signal: signal})
        response.end() // and close the connection. client should close the eventSource when receiving 'close' event
    })
}



function trySSL(key, cert){
    /* force HTTP server and skip reading files */
    return false
    if(process.env.DISABLE_SSL) return false
    try {
        /* blocking, but only once at start up */
        key = fs.readFileSync('key')
        cert = fs.readFileSync('cert')
        return true // only sets SSL_READY if reading both files succeeded
    } catch(SSL_ERROR){
        bookkeeper.log({SSL_ERROR: SSL_ERROR})
        return false
    }
}

function chooseFigJam(){
    /* figjam does a kind of webpack-y thing and streams all the files in order over a single request */
    /* but its an async/await situation compatible with node 8+, so check if we want to use it here */
    /* otherwise just return retrograde.html instead of building pages at time of request */
    if(parseInt(process.env.RETROGRADE) || parseInt(process.versions.node) < 8){
        return function(request, response){
            fs.createReadStream('retrograde.html')
            .on('error', function(err){ response.writeHead(500); response.end( JSON.stringify(err)) })
            .pipe(response)
        }
    } else {
        return require('./figjam')
    }
}
