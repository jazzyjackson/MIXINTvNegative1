# Poly-Int
## Polymorphic Interpreter

### An extensible and remixable space for cooperating with your network.

Cooperating may include:
- Uploading and modifying media on a shared, versioned filesystem
- Communicating in chatrooms of your own design
- Building applications and artwork for yourself and others

Your network may include:
- close friends and family
- your local wifi router
- co-workers and acquaintences
- transoceanic fiber optics

When you start Poly-Int on your machine, you're given a link that makes it accessible to anyone on the same network. If you're hosted in the cloud, or have an ISP that allows incoming connections on ports 80 and 443, the whole world is the same network. Otherwise, your shared online space is available on the same local network with or without any connection to the wider internet.

# Operator.js
Operator.js will connect your calls - fulfilling network requests in one of six ways:
 - A GET request to a file path will stream the file from disk to the caller
 - A GET request to a directory (ending in '/') is returned by generating the workspace/web application described by a 'figtree' (see below)
 - a PUT request to a file path will stream data from a caller to the operator's disk
 - a DELETE request does what you think
 - a POST request creates a child process in a shell of its own and pipes the stdio between the operator and caller (aka server and client)
 - a subscription can be made to a process, so that asynchronous data can be handled as an event stream via Server Sent Events API (SSE)

 ```js
/* try to read key and certificate from disk and enable HTTPS if true */
var SSL_READY  = trySSL(key, cert)       
/* check if private key and certificate were read properly and start server  */ 
require(SSL_READY ? 'https' : 'http')
.createServer(SSL_READY && {key: key, cert: cert})
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
```
 _See annotated code in guide/operator.js_


# Switchboard.js
Now, it might seem crazy to just expose a computer's filesystem and system shells to the network - but this is how mainframe timeshare systems have worked for decades: you let anyone call the machine up, but assign them a userid with appropriate permissions. So anyone can make a request to remove files (rm -rf) or Poweroff the machine, but if they don't have permissions, their request is politely declined. This layer of protection and precise management of who can and can't modify the system is built into the various Unixes, so whether you're on Linux or MacOSX or Windows Subsystem for Linux (Windows 10), Switchboard.js can generate permissions profiles for the participants of your network. You're given control of who has permission to view and add files to your machine, and all requests are handled by a child processes running as that account.
_More info and annotated code in guide/switchboard.js_

# Figtree.js


### GUI-Blocks
The web interface is comprised of HTML custom elements defined in the **gui-blocks** directory - each block provides different functionality: one is a terminal emulator, one is a code editor. An interface can consist of a single block - such as presenting a markdown document, a custom video player, or a slideshow - or it can be an arrangment of many blocks that make up a workspace of editors, file trees, and media players. 


### FigJam.js
A configuration graph (figtree for short) describes the layout of a workspace, which arranges HTML custom elements in the window and describes the attributes for each element. One attribute might be a source to pull content from (img, link, audio, and video tags make use of this already to load media, custom elements may be programmed to accept any filetype) - so the content of a workspace is kept separate from the presentation layer (layout, style, and interactivity via HTML, CSS, and JS). 

This figtree can exist as a file kept for different participants and projects, or it can be passed into the URL as a query string, producing your requested layout and content without having to keep the file on the server.

Try out some example workspaces:
coltenj.com/?fig=markdownEditor.json
coltenj.com/?fig=chatInStyle.json
coltenj.com/?figurl=head%shell%init=welcome.txts;lkasjdf;lkjsadf

Take a look at the configuration file by simply requesting it:
coltenj.com/figtrees/markdownEditor.json
coltenj.com/figtrees/chatInStyle.json
### Compatibility
If you started PolyInt on a machine with an old NodeJS version (Node 0.10.0 is the latest in many older linux distros), a limited set of features will still work fine, and I'm working on some bash scripts to help upgrade node on different architectures, stay tuned

you can also set an environment flag called "retrograde" to serve an html/css/js document that doesn't use any new features from the past 10 years if you want to target Internet Explorer 6 and son on.

# other ways of putting it 
The logical conclusion of chunked response streams and custom elements. I can pull the data necessary to build elements on the fly and then pull up whatever content I want from any source.

I also want to avoid re-implementing functioanlity that's been built into unix machines for decades. So I'm using bash builtins, coreutils, and the features of the TCP/IP stack whenever I can.

Public and Private chat channels a la Slack can be replicated by appending messages to a file and using tail 

Filesharing a la DropBox can be replicated with a 'file manager' element of your choosing and PUTing and GETing files and writing/reading to disk.

Adding events to a personal calendar has been built into unix since the 70s. 

My perspective is that interfaces are pretty easy to copy, and they're the part that makes a difference in what capabilites your computer gives you. The hard part of replicating all these services is the web server part - and especially serving thousands to millions of requests per day, and building software that can accomdate dozens to hundreds of full time contributors. The frameworks that accomodate these use cases require specialization and present a barrier to entry to learning how to build applications.

Poly Interpreter aims to provide an interactive timeshare application to dozens to hundreds of participants per day, not millions, so I get to have a much smaller, easier to inspect codebase with the intention of being modifiable by individuals, whether hacking away at stylesheets to make it look the way you want, or bolting on new functionality in web assembly, I want to make it obvious how everything works, so you can get it to work for you.

poly interpreter is a self-modifying environment for the iterative design of containerized applications

any language can be used to perform back-end logic
tying in back end api's from the front-end is as easy as POSTing a command

### operator.js
### switchboard.js
### figjam.js

### keymaker.js
### bookkeeper.js

### gui-blocks
### guide
### logs
### spiders

Adding functionality:
Functionality may come in the form of a program in any language kept in the spiders directory, to be executed on command for any user, or as new definitions for custom components, or a combination thereof: custom elements that rely on some back end functionality.
