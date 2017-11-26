# Poly-Int
## Polymorphic Interface

### An extensible and remixable space for cooperating with your network.

Cooperating may include:
- Uploading and modifying media on a shared, versioned filesystem
- Communicating in chatrooms of your own design
- Building applications and artwork for yourself and others

Your network may include:
- co-workers and acquaintences
- transoceanic fiber optics
- close friends and family
- chatbot personalities that control computers
- your local wifi router

When you start Poly-Int on your machine, you're given a link that makes it accessible to anyone on the same network. If you're hosted in the cloud, or have an ISP that allows incoming connections on ports 80 and 443, the whole world is the same network. Otherwise, your shared online space is available on your local network whether or not you have a connection to the world-wide-web.

When connected to a Poly-Int, you're served a graph of web-components that can be modified with code and content you write yourself. Whenever you arrange an environment with content and capabilities that are useful to you, the whole arrangement can be cloned to run on any other computer, using git remotes to synchronize content if desired. This allows for shared documents and chatrooms that are available offline and synchronize when connected.

Alongside acting as a file server, Poly-Int can execute programs in response to web requests in the vein of cgi scripts or amazon lambda functions. The complete functionality is provided by 4 programs: the operator, the switchboard, the keymaker, and figjam. Connectors to interface with chatbots are provided as spiders.

# Starting Poly-Int
git clone ...
make mini: to run without downloading anything else, total size < 1MB
make medium: to download useful external projects: showdown for rendering markdown files, codemirror for editing code, papa parse for working with csv and tabular data. Less than 10MB.
make max: clone the ChatScript project, including an entire local instance of Wordnet, an English dictionary and meaning-map. Uncompressed ~ 1GB

If you're running behind a load balancer or reverse proxy already and want all the internal requests to be HTTP, you can set an environment variable to "DISABLE_SSL" and neither switchboard nor operator will check for certificate files.

# Working with Owners, Groups, and the World with Switchboard.js

Many collaboration and file sharing tools require all participants to register an account with the service where they can choose what other accounts have access to their files - these accounts are managed by a web server that provides an authentication and access scheme of its own. I wanted to avoid re-implementing access control in my own application when *nix operating systems have sophisticated permissions capabilities built-in. 

Switchboard.js is my implementation of a reverse-proxy service that authenticates web requests and fulfills the requests by passing them to a nodejs microserver. An instance of operator.js is launched as a child process of switchboard.js, and it's called with `sudo -u` to run the microserver process as the identity associated with an incoming web request.

In this way, whatever permissions granted to a *nix id determine what files and programs can be accessed via web request. 

On *nix systems, every file/program/directory has true/false values for whether it can be read, overwritten, and run as an executable program. In human-readable (or 'symbolic') form this is expressed as 'rwx' for read-write-execute. 
These rwx permissions can be different for the creator of the file (called the __owner__), a __group__ (lists of particular identities that should be allowed to access the file), and __world__, sometimes called __other__, meaning, everybody else (including the special identity *nobody*).

So `rwx r-x ---` means the owner/creator can read, overwrite, and execute their own file, members of a group can read the file and run it as a program, but everybody else is prevented from any access. (If the directory the file is in is readable by the world, the world can see the file is there but can't read it. If a directory has its world permissions set to --- than no one else can see that the directory is there at all).

# Magic URLs and cookies with Keyconfig and Keymaker.js

Switchboard.js handles creating accounts and proxying requests to the right child process, but before it can do that it needs to know who the incoming request belongs to. Keymaker.js includes some regex to check for a session ID in the cookie and the 


# Switchboard.js
Switchboard.js routes your network requests in one of seven ways:

- a subscription can be made to a process, so that asynchronous data can be handled as an event stream via Server Sent Events API (SSE)
- A GET request to a directory (ending in '/') is returned by generating the workspace/web application described by a 'figtree'
- A GET request to a file path will stream the file from disk to the caller
- a PUT request to a file path will stream data from a caller to the operator's disk
- a POST request creates a child process in a shell of its own and pipes the stdio between the operator and caller (aka server and client)
- a DELETE request does what you expect
- an OPTIONS request performs a `stat` call and returns an object containing inode, ctime, atime, permission and ownership


 ```js
/* check if private key and certificate were read properly and start server with or without SSL  */ 
require(SSL_READY ? 'https' : 'http')
.createServer(SSL_READY && {key: key, cert: cert})
.on('request', function(req,res){  
    /* recursive ternary tests conditions until success */
    /event-stream/.test(req.headers.accept)           ? subscribe2events(req,res) :
    /\/(?=\?|$)/.test(req.url) && req.method == 'GET' ? figjam(req,res)           :
    req.method == 'GET'                               ? streamFile(req,res)       :
    req.method == 'PUT'                               ? saveBody(req,res)         :
    req.method == 'POST'                              ? streamSubProcess(req,res) :
    req.method == 'DELETE'                            ? deleteFile(req,res)       :
    req.method == 'OPTIONS'							  ? sendStat(req,res)         :
    res.end(req.method + ' ' + req.url + " Doesn't look like anything to me")     ;
})
```
 _See annotated code in guide/operator.js_



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
The intention is for the backend server to work the same on any system with NodeJS > 0.10.0, when the streams interface was upgraded to do more than just pipe. This is to facilitate switchboard.js being able to inspect the streams its proxying. If you you'll be accessing operator.js directly, I think it will work even on older installations, but all the repo's I've seen so far have at least 0.10.0.

I was writing lost of fancy promisified / async / await code that required Node 8+, but was disappointed with the effort it takes to upgrade Node on older linux distros, ARM architectures, and android devices. So making the code a little uglier to be compatible with the ANCIENT (2014 lol) version of nodeJS was prioritized. 

you can also set an environment flag called "retrograde" to serve an html/css/js document that doesn't use any new features from the past 10 years if you want to target Internet Explorer 6 and son on.

# other ways of putting it 
Polymorphic Interface is a
...file for making files
...chatroom for making chatroom
...program for making programs
...website for making websites
...server for making servers
...art for making art
...chatbot for making chatbots

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

