#!/usr/local/bin/node
var figjam     = require('./figjam')
var bookkeeper = require('./bookkeeper')
var fs         = require('fs')
var key, cert
var SSL_READY  = trySSL(key, cert)       /* try to read key and certificate from disk. enable HTTPS if true */

require(SSL_READY ? 'https' : 'http')   /* check if private key and certificate were read properly and start server  */
.createServer(SSL_READY && {key, cert}) /* if SSL_READY is null, then the boolean gaurd will return null             */
.on('request', function(req,res){       /* on receiving a network request, inspect request properties to respond     */
                                        /* via recursive ternary - continue until some condition is found to be true */
  req.headers.accept.match(/text\/event-stream/i)      ? subscibeToEvents(req,res)   : /* from new EventSource (SSE) */
  req.method == 'GET' && req.url.match(/.*\/(?=\?|$)/) ? figjam(req,res)             : /* url path w/ trailing slash */
  req.method == 'GET'                                  ? streamFile(req,res)         :
  req.method == 'POST'                                 ? streamSubprocess(req,res)   :
  req.method == 'PUT'                                  ? saveBody(req,res)           :
  req.method == 'DELETE'                               ? deleteFile(req,res)         :
  res.end(req.method + ' ' + req.url + "\nDoesn't look like anything to me")                                        ;
                                        /* start listening on port 3000 unless another number was passed as argument */
})                                      /* once the server is listening, print the port number to stdout             */
.listen(process.argv[2] || 3000)        /* switchboard will request port 0, which assigns a random, unused port      */
.on('listening', function(){ console.log(this.address().port) })

/************************************* Function definitions to fulfill requests **************************************/
function streamFile(request, response){
    fs.createReadStream(request.url.split('?')[0].slice(1))
    .on('error', err => { response.writeHead(500); response.end( JSON.stringify(err)) })
    .pipe(response)
}

function saveBody(request, response){
  console.log("saveBody")
  return false  
}

function streamSubProcess(request, response){
  return false  
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