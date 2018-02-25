#!/usr/local/bin/node
var wireworker = require('./imports/wireworker') // returns a class definition, must be called with new
var figjam     = require('./imports/figjam')
var child      = require('child_process')
var path       = require('path')
var url        = require('url')
var fs         = require('fs')
var os         = require('os')
/* try to read key and certificate from disk and enable HTTPS if true     */
var keycert    = new Object /* optionally: {key: filename, cert: filename}  */
/* useful thing about environment variables is they get figjammed to client side global 'window.env' */
process.env.APPROOT = process.env.APPROOT || process.cwd()
process.env.groups = process.getgroups()
process.env.identity = process.getuid()

require('http').createServer(function(req,res){ /* ternary tests conditions until success */ 
    /* get requests made from new EventSource (Server Sent Events)          */
    /event-stream/.test(req.headers.accept)           ? makeChild(req,res)   :
    /* /feed/rss appended to any path will return entries as xml            */
    /\/feed\/rss$/.test(req.url)                      ? makeRSS(req,res)     :
    /* GET requests with trailing slash before optional query string        */
    /\/(?=\?|$)/.test(req.url) && req.method == 'GET' ? figjam(req,res)      :
    req.method == 'POST'                              ? makeChild(req,res)   :
    req.method == 'OPTIONS'							  ? sendStat(req,res)    :
    req.method == 'GET'                               ? streamFile(req,res)  :
    req.method == 'PUT'                               ? saveBody(req,res)    :
    req.method == 'DELETE'                            ? deleteFile(req,res)  :
    res.end(req.method + ' ' + req.url + " Doesn't look like anything to me");
}).listen(process.env.PORT || 3000).on('listening', function(){ 
    console.log(this.address().port) 
    console.log("Started switchboard on port", this.address().port) 
})

/************************************* Get Content Type via mimemap.json **************************************/

/* load all possible content types into object so I can retrieve file extensions as a hash and set header */
var MIMEtypes = JSON.parse(fs.readFileSync(path.join(process.env.APPROOT,'configs','mimemap.json')))

function getContentType(filepath){
    var extension = /\.([a-z0-9]+)$/i.exec(filepath)
    // if regex returns null, MIMEtypes[null] returns undefined, no problem
    var extensionMatch = extension && extension[1].toLowerCase()
    return MIMEtypes[extensionMatch] || MIMEtypes['default']
}

/************************************* Function definitions to fulfill requests **************************************/

function makeChild(request, response){
    // future functionality should include a register of ongoing processes
    // (or is that operator level responsibility? should one identity be able to subscribe to another identities processes? no... I think you should start the proess for yourself, say if you want to tail -f a file, make a new pid...)
    return new wireworker(request, response)
}

function makeRSS(request, response){
    // returns an entry list with time modified, author, and first few lines of each file, 
    // if current user has permission to read. so this should expose file mode like OPTIONS does
    response.setHeader('Content-Type', 'application/rss+xml')
    // /feed/rss were the last 2 url parts, pathname is everything up to that.
    // might be imports/makeRSS.js, fs.listdir -> xml
    response.end('nothing to see here (yet)')
}

function streamFile(request, response){
    // check if the URL includes any file extensions that require a MIME type to be specified in Content-Type header
    var {pathname} = url.parse(request.url)

    var ContentType = getContentType(pathname)    
    response.setHeader('Content-Type', ContentType)
    // open and pipe the file, or throw back error (maybe file doesn't exist, var client know with a 500!)
    fs.createReadStream(decodeURI(pathname))
    .on('error', function(err){
        response.writeHead(500)
        response.end( JSON.stringify(err)) 
    }).pipe(response)
}

function saveBody(request, response){
    /* might automatically launch git commit here... */
    var {pathname} = url.parse(request.url)
    
    request.pipe(fs.createWriteStream(decodeURI(pathname)), 'utf8')
    .on('finish', function(){
        response.writeHead(201)
        response.end()
    }).on('error', function(err){
        response.writeHead(500)
        response.end( JSON.stringify(err)) 
    })
}

function deleteFile(request, response){
    var {pathname} = url.parse(request.url)

    fs.unlink(decodeURI(pathname), function(err){ 
        response.writeHead( err ? 500 : 204); 
        response.end(JSON.stringify(err))
    })
}

function sendStat(request,response){
    var {pathname} = url.parse(request.url)
    var ContentType = getContentType(pathname)
    response.setHeader('Content-Type', ContentType)
    // maybe this could check if size is minimum block size on system and then find out whether or not its a directory and set contenttype = application/directory or something
    // stat.size = process.
    fs.stat(decodeURI(pathname), function(err, stat){
        stat && Object.assign(stat, {ContentType})
        response.writeHead( err ? 500 : 200); 
        response.end(JSON.stringify(err || stat))
    })
}