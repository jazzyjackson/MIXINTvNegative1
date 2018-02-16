#!/usr/local/bin/node
process.platform.includes('win32') && process.exit(console.log("unix please"))
var figjam     = require('./figjam')
var keymaker   = require('./keymaker') // returns a new instance, keymaker is a class instance
var lineworker = require('./lineworker') // returns a class definition, must be called with new
var os         = require('os')
var fs         = require('fs')
var path       = require('path')
var child      = require('child_process')

/* some configuration options */
/* try to read key and certificate from disk and enable HTTPS if true     */
var keycert   = new Object /* optionally: {key: filename, cert: filename}  */
var SSL_READY = keymaker.trySSL(keycert)
var appRoot  = process.env.appRoot || process.cwd()
var MIMEtypes = JSON.parse(fs.readFileSync(path.join(appRoot, 'mimemap.json')))

/* check if private key and certificate were valid, start server either way */
require(SSL_READY ? 'https' : 'http')
.createServer(SSL_READY && keycert)
.on('request', function(req,res){ /* ternary tests conditions until success */ 
    /* get requests made from new EventSource (Server Sent Events)          */
    /event-stream/.test(req.headers.accept)           ? makeChild(req,res)   :
    /* get requests with trailing slash before optional query string        */
    /\/(?=\?|$)/.test(req.url) && req.method == 'GET' ? figjam(req,res)      :
    req.method == 'POST'                              ? makeChild(req,res)   :
    req.method == 'OPTIONS'							  ? sendStat(req,res)    :
    req.method == 'GET'                               ? streamFile(req,res)  :
    req.method == 'PUT'                               ? saveBody(req,res)    :
    req.method == 'DELETE'                            ? deleteFile(req,res)  :
    res.end(req.method + ' ' + req.url + " Doesn't look like anything to me");
})
.listen(process.argv[2] || 0)
.on('listening', function(){ 
    console.log(this.address().port) 
    console.log("Started switchboard on port", this.address().port) 
    // console.log("OK here's the ENV", process.env)
})

/************************************* Function definitions to fulfill requests **************************************/

function makeChild(request, response){
    return new lineworker(request, response)
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
    var extensionMatch = extension && extension[1].toLowerCase()
    return MIMEtypes[extensionMatch] || MIMEtypes['default']
}