# Poly-Int
### Polymorphic Interpreter

### An extensible and remixable space for cooperating with your network.

Cooperating may include:
- Uploading and modifying media on a shared, versioned filesystem
- Communicating in chatrooms of your own design
- Building applications and artwork for yourself and others

Your network may include:
- close friends and family
- your local wifi router
- distant acquiantences 
- transoceanic fiber optics
- strangers with a common interest
- low-cost cloud infrastructure
- coworkers and business partners
- physical computers you control

When you start Poly-Int on your machine, you're given a link that makes it accessible to anyone on the same network. If you're hosted in the cloud, or have an ISP that allows incoming connections on ports 80 and 443, the whole world is the same network. Otherwise, participants in the same room can use this shared online space with or without any connection to the wider internet.

### GUI-Blocks
The web interface is comprised of HTML custom elements defined in the **gui-blocks** directory - each block provides different functionality: one is a terminal emulator, one is a code editor. An interface can consist of a single block - such as presenting a markdown document, a custom video player, or a slideshow - or it can be an arrangment of many blocks that make up a workspace of editors, file trees, and media players. 

### Operator.js
The web interface is coupled with a nodejs server that provides a minimal connector to the services of the computer its running on. GET requests serve files, POST requests execute commands in a sub-process, PUT requests save request bodies directly to disk and DELETE requests 

### Switchboard.js
To provide access with varying degrees of priveledge (are you root? or are you a nobody?), a nodejs process called **switchboard** creates unix users with specified permissions for each participant and starts an **operator** __as that new user__, so all requests to read, write, delete, and execute files are handled by the operating system. 

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

(see guide/figjam and guide/figurl for how this works)

The logical conclusion of chunked response streams and custom elements. I can pull the data necessary to build elements on the fly and then pull up whatever content I want from any source.

Public and Private chat channels a la Slack can be replicated by appending messages to a file and using tail 

Filesharing a la DropBox can be replicated with a 'file manager' element of your choosing and PUTing and GETing files 

My perspective is that interfaces are pretty easy to copy, and they're the part that makes a difference in what capabilites your computer gives you. The hard part of replicating all these services is the web server part - and especially serving thousands to millions of requests per day, and building software that can accomdate dozens to hundreds of full time contributors. The frameworks that accomodate these use cases require specialization and present a barrier to entry to learning how to build applications.

Poly Interpreter aims to provide an interactive timeshare application to dozens to hundreds of participants per day, not millions, so I get to have a much smaller, easier to inspect codebase with the intention of being modifiable by individuals, whether hacking away at stylesheets to make it look the way you want, or bolting on new functionality in web assembly, I want to make it obvious how everything works, so you can get it to work for you.

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
