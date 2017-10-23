#!/usr/local/bin/node
var os         = require('os')
var fs         = require('fs')
var bookkeeper = require('./bookkeeper')
var exec       = require('child_process').exec
var figjam     = chooseFigJam()
var key, cert
/* try to read key and certificate from disk and enable HTTPS if true */
var SSL_READY  = trySSL(key, cert)       
/* check if private key and certificate were read properly and start server  */ 
require(SSL_READY ? 'https' : 'http')
.createServer(SSL_READY && {key: key, cert: cert})
.on('request', function(req,res){  
    /* recursive ternary tests conditions until success */
    /text\/event-stream/.test(req.headers.accept)         ? subscribe2events(req,res) : /* from new EventSource (SSE) */
    /application\/octet-stream/.test(req.headers.accept)  ? pipeProcess(req,res)      : /* fetch with binary data */
    /\/(?=\?|$)/.test(req.url) && req.method == 'GET'     ? figjam(req,res)           : /* url path w/ trailing slash */
    req.method == 'GET'                                   ? streamFile(req,res)       :
    req.method == 'PUT'                                   ? saveBody(req,res)         :
    req.method == 'POST'                                  ? streamSubProcess(req,res) :
    req.method == 'DELETE'                                ? deleteFile(req,res)       :
    res.end(req.method + ' ' + req.url + "\n" + "Doesn't look like anything to me")   ;
})
.listen(process.argv[2] || 3000)       
.on('listening', function(){ console.log(this.address().port) })
/* start listening on port 3000 unless another number was passed as argument */
/* once the server is listening, print the port number to stdout             */
/* switchboard will request port 0, which assigns a random, unused port      */

/************************************* Function definitions to fulfill requests **************************************/

function streamFile(request, response){
    fs.createReadStream(request.url.split('?')[0].slice(1))
    .on('error', function(err){ response.writeHead(500); response.end( JSON.stringify(err)) })
    .pipe(response)
}

function saveBody(request, response){
    request.pipe(fs.createWriteStream('.' + request.url, 'utf8'))
    .on('finish', function(){ response.writeHead(201); response.end() })
    .on('error', function(err){ response.writeHead(500); response.end( JSON.stringify(err)) })
}

function streamSubProcess(request, response){
    /* check for pid in parameters, pipe body to existing process if available, else throw 'no process with that pid' */
    response.setHeader('Content-Type', 'application/octet-stream')
    response.setHeader('Trailer', 'Exit-Code')
    var subprocess = exec(decodeURIComponent(request.url.split('?')[1]), {
        cwd: process.cwd() + request.url.split('/').slice(0,-1).join('/')
    })
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
}

function subscribe2events(request, response){
    response.setHeader('Content-Type', 'text/event-stream')
    var msgid = 0
    var pushEvent = function(name,data){
        response.write('id:' + ++msgid + '\nevent: ' + name + '\ndata:' + JSON.stringify(data) + '\n\n')
    }

    var subprocess = exec(decodeURIComponent(request.url.split('?')[1]), {
        cwd: process.cwd() + request.url.split('/').slice(0,-1).join('/')
    })
    /* ... I wonder if I can register this subprocess to global, and allow subsequent POSTs to PID to be piped here... maybe maybe */

    var heartbeat = setInterval(function(){pushEvent(':heartbeat','')},1500)
    pushEvent('pid', subprocess.pid)
    
    subprocess.on('error', function(error){
        pushEvent('error', error)
    })
    subprocess.stdout.on('data', function(data){
        pushEvent('stdout',data)
    })
    subprocess.stderr.on('data', function(data){
        pushEvent('stderr',data)
    })
    subprocess.on('close', (code,signal) => {
        clearInterval(heartbeat) // stop trying to send heartbeats
        pushEvent('close', {code: code, signal: signal})
        response.end()
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
