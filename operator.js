#!/usr/local/bin/node
var figjam     = require('./figjam')
var bookkeeper = require('./bookkeeper')
var fs         = require('fs')
var exec       = require('child_process').exec
var os         = require('os')
var key, cert
/* try to read key and certificate from disk and enable HTTPS if true */
var SSL_READY  = trySSL(key, cert)       
/* check if private key and certificate were read properly and start server  */ 
require(SSL_READY ? 'https' : 'http')
.createServer(SSL_READY && {key, cert})
.on('request', function(req,res){       
    /* on receiving a network request, inspect request properties to determine response   */
    /* via recursive ternary - continue until some condition is found to be true          */
    req.headers.accept.match(/text\/event-stream/i)       ? subscibeToEvents(req,res)   : /* from new EventSource (SSE) */
    req.headers.accept.match(/application\/octet-stream/) ? pipeProcess(req,res)        : /* fetch with binary data */
    req.method == 'GET' && req.url.match(/.*\/(?=\?|$)/)  ? figjam(req,res)             : /* url path w/ trailing slash */
    req.method == 'GET'                                   ? streamFile(req,res)         :
    req.method == 'POST'                                  ? streamSubProcess(req,res)   :
    req.method == 'PUT'                                   ? saveBody(req,res)           :
    req.method == 'DELETE'                                ? deleteFile(req,res)         :
    res.end(req.method + ' ' + req.url + "\n" + "Doesn't look like anything to me")     ;
})                                      
.listen(process.argv[2] || 3000)       
.on('listening', function(){ console.log(this.address().port) })
/* start listening on port 3000 unless another number was passed as argument */
/* once the server is listening, print the port number to stdout             */
/* switchboard will request port 0, which assigns a random, unused port      */

/************************************* Function definitions to fulfill requests **************************************/
function subscibeToEvents(request, response){

}

function streamFile(request, response){
    fs.createReadStream(request.url.split('?')[0].slice(1))
    .on('error', err => { response.writeHead(500); response.end( JSON.stringify(err)) })
    .pipe(response)
}

function saveBody(request, response){
    request.pipe(fs.createWriteStream('.' + request.url, 'utf8'))
    .on('finish', () => { response.writeHead(201); response.end() })
    .on('error', err => { response.writeHead(500); response.end( JSON.stringify(err)) })
}

function streamSubProcess(request, response){
    console.log(decodeURIComponent(request.url.split('?')[1]))
    subprocess = exec(decodeURIComponent(request.url.split('?')[1]), {
        cwd: process.cwd() + request.url.split('/').slice(0,-1).join('/')
    })
    subprocess.on('error', err => { 
        response.writeHead(500); 
        response.end(JSON.stringify(err)) 
    })
    subprocess.stdout.on('data', data => {
        response.write("event: stdout" + "\n" + "data:" + JSON.stringify(data)) //JSON stringify does a pretty good job of escaping things
    })
    subprocess.stderr.pipe(response)
}

function deleteFile(request, response){
  return false  
}

function trySSL(key, cert){
    /* force HTTP server and skip reading files */
    if(process.env.DISABLE_SSL) return false
    try {
        key = fs.readFileSync('key')
        cert = fs.readFileSync('cert')
        return true // only sets SSL_READY if reading both files went off without a hitch
    } catch(SSL_ERROR){
        bookkeeper.log({SSL_ERROR})
        return false
    }
}