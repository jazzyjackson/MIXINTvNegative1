#!/usr/local/bin/node
process.platform.includes('win32') && process.exit(console.log("Please start me on something unixy."))
var os          = require('os')
var fs          = require('fs')
var inspect     = require('util').inspect
var spawn       = require('child_process').spawn
var bookkeeper  = require('./bookkeeper')
var keymaker    = require('./keymaker')
var offspring   = require('./offspring')
var figjam      = require('./figjam')
var keycert     = new Object
/* try to read key and certificate from disk and enable HTTPS if true */
var SSL_READY  = keymaker.trySSL(keycert)
/* check if private key and certificate were read properly and start server  */ 
require(SSL_READY ? 'https' : 'http')
.createServer(SSL_READY && keycert)
.on('request', function(req,res){  
    /* recursive ternary tests conditions until success */
    /event-stream/.test(req.headers.accept)           ? makeChild(req,res) : /* from new EventSource (SSE) */
    /\/(?=\?|$)/.test(req.url) && req.method == 'GET' ? figjam(req,res)           : /* url path w/ trailing slash */
    req.method == 'POST'                              ? makeChild(req,res) :
    req.method == 'OPTIONS'							  ? sendStat(req,res)         :
    req.method == 'GET'                               ? streamFile(req,res)       :
    req.method == 'PUT'                               ? saveBody(req,res)         :
    req.method == 'DELETE'                            ? deleteFile(req,res)       :
    res.end(req.method + ' ' + req.url + " Doesn't look like anything to me")     ;
})
.listen(process.argv[2] || 3000)       
.on('listening', function(){ console.log(this.address().port) })

/* start listening on port 3000 unless another number was passed as argument */
/* once the server is listening, print the port number to stdout             */
/* switchboard will request port 0, which assigns a random, unused port      */

/************************************* Function definitions to fulfill requests **************************************/

function makeChild(request, response){
    var args = offspring.parseArgsFrom(request)
    var targetProcess = args.pid && args.startTime ? `${args.pid}+${args.startTime}`
                                                   :  request.headers['x-target-process']
    // if targetProcess is undefined, fine, don't reconnect
    if(offspring.ongoing.includes(targetProcess)){
        console.log("found target:", targetProcess)
        offspring[targetProcess].reconnect(request, response)
    } else if(targetProcess){
        console.log("found target:", targetProcess)        
        // if a targetProcess was described but doesn't exist return error
        response.writeHead(500)
        response.end(`${targetProcess} not found`)
    } else {
        console.log("forking:", request.url)
        
        // if targetProcess was not described, fork a new child process and pipe results to response
        // fork will inspect request and decide to return an event stream or a raw buffer pipe.
        offspring.connect(request, response)   
    }
}

function streamFile(request, response){
    request.url.split('?')[0].includes('.svg') && response.setHeader('Content-Type','image/svg+xml')
    request.url.split('?')[0].includes('.css') && response.setHeader('Content-Type','text/css')

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

function sendStat(request,response){
    fs.stat('.' + decodeURIComponent(request.url), function(err, stat){ 
        response.writeHead( err ? 500 : 200); 
        response.end(JSON.stringify(err || stat))
    })
}

process.on('uncaughtException', exception => {
    console.log('exception from switchboard.js!')
    console.log(exception)
})