#!/usr/local/bin/node
process.platform.includes('win') && process.exit(console.log("Please start me on something unixy."))
var os          = require('os')
var fs          = require('fs')
var bookkeeper  = require('./bookkeeper')
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
    /octet-stream/.test(req.headers.accept)           ? pipeProcess(req,res)      : /* fetch with binary data */
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

function streamFile(request, response){
    /* response.setHeader('x-githash', process.env.githash) // send metadata about what version of a file was requested */
    fs.createReadStream(request.url.split('?')[0].slice(1))
    .on('error', function(err){ response.writeHead(500); response.end( JSON.stringify(err)) })
    .pipe(response)
}

function saveBody(request, response){
    /* might automatically launch git commit here... */
    request.pipe(fs.createWriteStream('.' + request.url, 'utf8'))
    .on('finish', function(){ response.writeHead(201); response.end() })
    .on('error', function(err){ response.writeHead(500); response.end( JSON.stringify(err)) })
}

function streamSubProcess(request, response){
    if(request.headers && request.headers["x-for-pid"]){
        console.log('for pid', request.headers["x-for-pid"])
        console.log(request.body)
    }
    /* check for pid in parameters, pipe body to existing process if available, else throw 'no process with that pid' */
    response.setHeader('Content-Type', 'application/octet-stream')
    response.setHeader('Trailer', 'Exit-Code')

    var workingDirectory=  process.cwd() + request.url.split('/').slice(0,-1).join('/')
    var command = decodeURIComponent(request.url.split('?')[1])

    var subprocess = spawn('sh', ['-c', command], { cwd: workingDirectory })

    subprocess.on('error', function(err){ 
        response.writeHead(500); 
        response.end(JSON.stringify(err)) 
    })
    /* I had a curious data drop out, I wonder if stderr piped a null byte and closed the connection early */
    /* lets not allow stdio to close connection, wait until process exits, As a bonus, I get to send the exit code */
    subprocess.stdout.pipe(response, {end: false})
    subprocess.stderr.pipe(response, {end: false})

    subprocess.on('close', (code,signal) => {
        /* OK fine, trailers aren't really supported by anyone right now, maybe they'll be in HTTP2 */
        response.addTrailers({'Exit-Code': code || signal})
        response.end()
    })

    subprocess_registry[subprocess.pid] = subprocess
    
}

function subscribe2events(request, response){
    response.setHeader('Content-Type', 'text/event-stream')
    var command = decodeURIComponent(request.url.split('?')[1])
    var workingDirectory = process.cwd() + request.url.split('/').slice(0,-1).join('/')
    var msgid = 0 // this is used to identify already digested messages on reconnecting from a bad connection,
    /* but an index isn't enough. I think I have to send a header including request start, and work that into a hash somehow? 
    /* So that if client receives a message with the same content, with the same request begin time, client can disregard it based on msgid... */
    var pushEvent = function(name,data){
        response.write(['id:', ++msgid, '\n',// point is msgid is a placeholder for future functionality
                        'event: ', name, '\n',
                        'data: ', data ? JSON.stringify(data) : '', '\n',
                        '\n'].join(''))
    }
    if(!command.length){
        pushEvent('close',{code: null, signal: null})
        return response.end()
        /* return so I don't try to execute an empty command */
    }
    var subprocess = spawn('sh', ['-c', command], { cwd: workingDirectory })
    subprocess_registry[subprocess.pid] = subprocess

    var heartbeat = setInterval(function(){pushEvent(':heartbeat')},15000)
    pushEvent('pid', subprocess.pid)
    
    subprocess.on('error', function(error){
        pushEvent('error', error)
    })
    subprocess.stdout.on('data', function(data){
        pushEvent('stdout',data.toString())
    })
    subprocess.stderr.on('data', function(data){
        pushEvent('stderr',data.toString())
    })
    subprocess.on('close', (code,signal) => {
        clearInterval(heartbeat) // stop trying to send heartbeats
        pushEvent('close', {code: code, signal: signal})
        response.end() // and close the connection. client should close the eventSource when receiving 'close' event
        delete subprocess_registry[subprocess.pid] //forgeddaboutit
    })
}

function deleteFile(request, response){
    fs.unlink('.' + request.url, function(err){ 
        response.writeHead( err ? 500 : 204); 
        response.end(JSON.stringify(err))
    })
}

function trySSL(key, cert){
    /* force HTTP server and skip reading files */
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
