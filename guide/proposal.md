My dreams:
As soon as you create a file, you can share the file
As soon as you write a program, it can be executed locally or remotely

I can share, edit, and execute files inside a chatroom
I can talk to a chatbot in a chatroom, or invite humans to join us

The chatbot can help you find files and programs that are useful to you.
The chatbot can open, run, and write files on your behalf.

Have an interface with style I can customize with live preview and commit the result
Have an interface I can arrange to include components I want and share the arrangement via URL

(Various arrangements of web components can provide the functionality of dropbox, bitbucket, slack, jupyter notebook, etc., which is to say, it's just a web server, it will do whatever you want it to.)

Basic components: file viewer (text/media), code editor, directory navigator, chatroom. 

Chatroom has two modes: a terminal emulator (talking to self) where you can execute bash commands with the help of a chatbot personality. In 'self' mode, each input launches an 'event source' that streams the stdout of a process. In 'party' mode, each input 

Perhaps most useful is to do all this inside docker containers, customizing applications by swapping out web components and data connectors and easily archiving and sharing experiments.

Problems with utilitybot:
relies on connection to S3, signing URLs is an unresolved bug (works on develop server, not on prod)
changes to code lag behind build plan, updates are pulled from a dropbox account, downloading and re-uploading spreadsheet is tedious.
The script has been reduced to a flow chart + recomendation engine,
We dropped the more interesting templates that allowed for "I want to run ${tool} with ${argumet}"
Scripts are open to SQL injection at the moment

Things I think chatbot could help with:
A better proposal:
A clone of AUBI is spun up on a per-client/client-group basis, packaged with utilities and scripts needed for a certain audience.
Avoid building a script that serves every need (A fact-querying script to help suggest tools can serve one need, a comscore expert another)
quickly deploy new tools that only require a text interface (+ a choose file / upload / download file interface)
help suggest tools the computer provides for you - convert from one data type to another, pipe a large text file through a regex filter, tell you what text encoding a file seems to be using...

An operator to tell you 'whats in the box/container'
Upload and share files big/small/text/video on internal bandwidth
Choose to open file as plain text or a table, option to download or update
ability to quickly alter the style of the interface for a particular client
Rapid prototyping of utility scripts and dialogue in-situ 
- if something doesn't work, the logs can be inspected right there, and fixes applied immediately
- maybe if something is confusing, I can ask a person to join me on a dev-server, make changes until it makes sense
- Back button on conversations
Tell aubi to push itself to prod