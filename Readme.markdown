# MIXINT
## ReMIXable INTerface for data subscription, archival, and conversation

MIXINT is a free (as in freedom) server and web application allowing owners, groups, and the world to publish and subscribe to each other's file directories. Calendar events, chat messages, RSS subscriptions, and documents are organized in plain text formats on a shared file system controlled by you (or your friendly neighborhood sysdamin). JSON and markdown files can be presented by custom elements or linked to directly. The stylesheets and source code to any component of the workspace is only a few clicks away, so MIXINT can be customized and extended without downtime. 

Prospects:
- [Internet Connection Optional](#ico)
- [No Assembly Required](#nar)
- [Rearrangeable Message Threads](#rmt)
- [Configurable Fingers and Footprints](#cff)
- [Shallow Technology Stack](#sts)
- [All You See is a Mirror](#asm)

Roadmap:
- [2018 Conceptualization](#2018)
- [2019 Monitization](#2019)
- [2020 Federalization](#2020)

## <a name="ico"></a>
## Internet Connection Optional 
Collaborative editing tools are great, until you're collaborating on a farm with flakey internet. (I'll have to blog about my Open Source Ecology experience.) MIXINT gives chatrooms and shared folders to teams sitting around the same table with zero configuration. You can start MIXINT on one machine and give your neighbors an address to sign on. 

Since calendars, chatrooms, and documents are just files in directories, you can use git or rsync to work offline. Keep a globally accessible cloud server online for $5/month, and back your work up when you have a good connection. Otherwise, anyone on the same local network can still collaborate in whatever directories you store on your own machine.

## <a name="nar"></a>
## No Assembly Required 
MIXINT is unique in providing a framwork for building custom applications while being useful out-of-the-box. In addition, tools for editing the source code of the server, creating new API endpoints, and customizing the stylesheets of all components are provided. Components bundled with v0:

- chatroom
- calendar
- RSS feed manager for news, podcasts, and other subscriptions
- Code / Markdown editor with live preview
- http agent for testing API endpoints & constructing HTTP requests a la curl
- library (a.k.a. file explorer)
- media player
- crontab editor for process scheduling
- identity and group editor for access control
- file access + cpu usage logs & analytics view

## <a name="rmt"></a>
## Rearrangeable Message Threads 

Chatrooms in MIXINT are unlike any other platform. Every message is a plain text file on disk (JSON format), owned by the identity that PUTS it there. You can consider any directory on the filesystem to be a 'topic' and start a conversation by creating a file containing your message. A chat interface is provided by a customizable web component: every participant may apply their own stylesheet, and functionality can be added by editing the source code in-browser. File attachments can be dropped into the chat interface and they will be uploaded in whatever directory the conversation is taking place. Any of these individual files can have its read/write permissions modified by whoever PUT the message, so that authors can determine whether their message can be linked to and shared publically or if its 

Keeping every message as a normal file has novel side effects. By default, if you have permission to write files to a directory, you also have permission to delete files. If you've ever been in a twitter thread and seen someone say "Delete this" - that's now within your rights as a participant of a conversation. In the same manner, you're within your rights to overwrite a file with your own comment 

Another option provided by unix filesystems is to set the "sticky bit" on the directory, which prevents files from being modified by anyone except the owner or an administrator. This will give you a more traditional permissions system where you can edit your own messages

Subthreads are achieved by simply creating a new directory with the same filename as a message sans file extension. For example, `.convoplex.cj.1525764209.json` might represent a message in a chatroom, and if anyone clicks 'reply' a new directory `.convoplex.cj.1525764209` will be created to house messages and related files. As this all takes place on your machine's native filesystem, creating subdirectories can be repeated for arbitrarily nested conversations. Being normal files and directories also means messages and topics can be moved, deleted, copied, or linked in whatever way you like. The read/write permissions 


 symbolic links to entire topics can be made in other topics, so that any thread can be mixed in with any other relevant thread.

 Furthemore, every time a file is fetched 



 [Until I can explain this better myself, see the wikipedia on file permissions, ]


## <a name="cff"></a>
## Configurable Fingers + Footprints 
Having detailed access logs is important for managing a server: it allows you to check what files are being accessed by whom, and it allows you to monitor usage and load over time to hint at whether your server has enough power to serve your team's needs.

However, the owner of a service having more information than clients of a service can lead to distrust: how can I know my picture is really deleted? How do I know if the service provider is tracking my IP address? By default, MIXINT allows everyone in the community to see this information so they can trust that they know what it's recording.

## <a name="sts"></a>
## Shallow Technology Stack 
MIXINT wants to be understood. Not only is there a focus on front end code being auditable (harkening back to web 1.0 days where a quick 'view source' would tell you everything you needed to know, you can click + modify:style/class/template to read the source), everything that happens has a visible effect on the back end machine: a file is created, a program returns its output, or a file watch is executed - and very little  happens in between. Because the server allows arbitrary bash commands, you can find out exactly what program is running to return a response - then fire off a GET request to read the source code of that program. 

For example, the chatroom is not running any particular protocol or built on top of a database. You choose a chatroom component and point its 'src' attribute to any 
Any 'topic' can contain any number of relevant attachments and sidechain conversations (subtopics are merely subdirectories, and contain their own )

This is unique among conversation platforms: to create private sidechain conversations in the context of the larger topic. People who can read messages in one topic can see that subtopics exist, but may be denied read permissions if the owner of that subtopic makes it private. See "Working with owners, groups, and the world"

## <a name="asm"></a>
## All You See is a Mirror 
MIXINT has an archive-first policy. Articles and media fetches from RSS feeds are stored on disk, sharing links to images and video creates a backup for offline viewing. 

As feeds can be followed across domains, a server only has to serve its community and the other servers that follow your server - not everyone in the world that wants to view a video.

Why should the creator of a video get to "disable comments" ? Sure, if its their platform... but I'm somehow not allowed to copy the video, and also not allowed to comment on the page? 

## Roadmap

### <a name="2018"></a>
### 2018 Conceptualization 

Stabilizing naming conventions, component API, and initial style + Guides.

The major blind spot for me is coming up with a strategy for package management, especially for sharing new web components. Maybe NPM can bootstrap this, but I want to investigate more git/IPFS/decentralized means to import new functionality.

### <a name="2019"></a>
### 2019 Monitization

I'm keen to understand the integration of Keybase and Stellar: an identity authentication service and a pre-mined token that uses standard public key cryptography to make transactions without any proof-of-work burning a pound of coal.

[Keybase](https://keybase.io) is quickly becoming the de facto platform for ensuring a file was created by its alleged author. This approaches the problem that I consider most insanity-inducing in the 21st century: the in-flight modification of audio, images, and streaming video. Deciding what sources we trust and having public key authentication become second nature is essential for understanding what's real in pulling information down from the cloud. I have it in mind to tie in openssl utilities to do this manually, but keybase has a fully-authenticated-file-system in production - it just needs its interface... remixed ;)

[Stellar](https://stellar.org) is approaching a problem as old as the internet: can't we just divvy up a dollar between the 20 podcasts we're subscribed to? Can we create HTTP endpoints that demand a penny to serve the request? (Or how about a database export that demands a dollar for bandwidth?) Stellar may allow these micro-transactions where credit card processing fees and infrastruction proved prohibitive.

### <a name="2020"></a>
### 2020 Federalization

Once basic functionality is implemented for a single machine, different strategies for load balancing, localization, and content discovery will be investigated. Built into proof-of-concept are components for following remote feeds via RSS or Git, and I expect this to facilitate distribution of media without too much load on individual servers, if participants in this project boot up their own servers to redistribute media to their own communities. But this is a risk, and how Diaspora* died: too much effort to set up a new node --> tragedy of the commons very quickly.

However, it would be ideal if members of a community could contribute their storage to redundant backups and their bandwidth to additional capacity for serving strangers.

------

Move away from data farming

toward an information permaculture

------
