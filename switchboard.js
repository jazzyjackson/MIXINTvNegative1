#!/usr/local/bin/node
process.platform.includes('win32') && process.exit(console.log("*nix please"))
var child      = require('child_process')
var wireworker = require('./wireworker') // returns a class definition, must be called with new
var keymaker   = require('./keymaker') // returns a new instance, keymaker is a class instance
var figjam     = require('./figjam')
var path       = require('path')
var fs         = require('fs')
var os         = require('os')

/* some configuration options */
/* try to read key and certificate from disk and enable HTTPS if true     */
var keycert    = new Object /* optionally: {key: filename, cert: filename}  */
var SSL_READY  = keymaker.trySSL(keycert)
var appRoot    = process.env.APPROOT || process.cwd()
/* 0 will request a random, available port from the host OS */
var serverPort = process.argv[2] || 0 
/* load all possible content types into object so I can retrieve file extensions as a hash and set header */
var MIMEtypes = JSON.parse(fs.readFileSync('mimemap.json'))
// var MIMEtypes = JSON.parse(fs.readFileSync(path.join(appRoot, 'mimemap.json')))
/* check if private key and certificate were valid, start server either way */
require(SSL_READY ? 'https' : 'http')
.createServer(SSL_READY && keycert)
.on('request', function(req,res){ /* ternary tests conditions until success */
    /* GET requests made from new EventSource (Server Sent Events)          */
    /event-stream/.test(req.headers.accept)           ? makeChild(req,res)   :
    /* /feed/rss appended to any path will return entries as xml            */
    /\/feed\/rss$/.test(req.url)                     ? makeRSS(req,res)     :
    /* GET requests with trailing slash before optional query string        */
    /\/(?=\?|$)/.test(req.url) && req.method == 'GET' ? figjam(req,res)      :
    req.method == 'POST'                              ? makeChild(req,res)   :
    req.method == 'OPTIONS'                           ? sendStat(req,res)    :
    req.method == 'GET'                               ? streamFile(req,res)  :
    req.method == 'PUT'                               ? saveBody(req,res)    :
    req.method == 'DELETE'                            ? deleteFile(req,res)  :
    res.end(req.method + ' ' + req.url + " Doesn't look like anything to me");
})
.listen(serverPort)
.on('listening', function(){ 
    console.log(this.address().port) 
    console.log("Started switchboard on port", this.address().port) 
    // console.log("OK here's the ENV", process.env)
})

/************************************* Function definitions to fulfill requests **************************************/

function makeChild(request, response){
    return new wireworker(request, response)
}

function makeRSS(request, response){
    // returns an entry list with time modified, author, and first few lines of each file, 
    // if current user has permission to read. so this should expose file mode like OPTIONS does
    response.setHeader('Content-Type', 'application/rss+xml')
    // /feed/rss were the last 2 url parts, pathname is everything up to that.
    response.end('nothing to see here (yet)')
}

function streamFile(request, response){
    // check if the URL includes any file extensions that require a MIME type to be specified in Content-Type header
    var filepath = path.join(appRoot, decodeURI(request.url.split('?')[0]))
    var ContentType = getContentType(filepath)    
    response.setHeader('Content-Type', ContentType)
    // open and pipe the file, or throw back error (maybe file doesn't exist, var client know with a 500!)
    fs.createReadStream(filepath)
    .on('error', function(err){
        response.writeHead(500)
        response.end( JSON.stringify(err)) 
    }).pipe(response)
}

function saveBody(request, response){
    /* might automatically launch git commit here... */
    var filepath = path.join(appRoot, decodeURI(request.url))
    request.pipe(fs.createWriteStream(filepath), 'utf8')
    .on('finish', function(){
        response.writeHead(201)
        response.end()
    }).on('error', function(err){
        response.writeHead(500)
        response.end( JSON.stringify(err)) 
    })
}

function deleteFile(request, response){
    var filepath = path.join(appRoot, decodeURI(request.url))
    fs.unlink(filepath, function(err){ 
        response.writeHead( err ? 500 : 204); 
        response.end(JSON.stringify(err))
    })
}

function sendStat(request,response){
    var filepath = path.join(appRoot, decodeURI(request.url))
    var ContentType = getContentType(filepath)
    response.setHeader('Content-Type', ContentType)
    
    fs.stat(filepath, function(err, stat){
        stat && Object.assign(stat, {ContentType})
        response.writeHead( err ? 500 : 200); 
        response.end(JSON.stringify(err || stat))
    })
}

function getContentType(filepath){
    var extension = /\.([a-z0-9]+)$/i.exec(filepath)
    // if regex returns null, MIMEtypes[null] returns undefined, no problem
    var extensionMatch = extension && extension[1].toLowerCase()
    return MIMEtypes[extensionMatch] || MIMEtypes['default']
}