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

A configuration graph (figtree for short) describes the layout of a workspace, which arranges HTML custom elements in the window and describes the attributes for each element. One attribute might be a source to pull content from (img, link, audio, video tags make use of this already) - so the content of a workspace is kept separate from the presentation layer (layout, style, and interactivity via HTML, CSS, and JS). This figtree can exist as a file kept for different participants and projects, or it can be passed into the URL as a query string, producing your requested layout and content without having to keep the file on the server.

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

My perspective is that interfaces are pretty easy to copy, and they're the part that makes a different in what your capabilities with the computer are. The hard part of replicating all these services is that web server part - and especially serving thousands to millions of users per day. 

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