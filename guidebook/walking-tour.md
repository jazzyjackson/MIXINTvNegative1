I have this dream of writing a web server that offers to configure itself for different needs. Kind of like that cow in the Restaurant at the End of the Universe that recommends its own liver, and rolls its eyes when you ask for a salad.

Code that provides an API for adding functionality to a running server is paired with a chatbot personality that can have a scripted conversation and make changes to files and the underlying operating system.

This tour introduces each file full of functions, first as metaphors for what they do, then as code snippets to describe their role in the running program.

# what can you do with it

The core functionality is a web-browser teletype that can run commands on a remote server or talk to you in natural language, and the responses are streaming and you can run more than one thing at a time. 

But on top of that is a windowing system of components with a prototype chian

It lets you browse and modify files while having a conversation. You can say what you want, build it / get help building it, execute it, say how it works, talk about the code with it highlighted, the the natural language engine will be recording all that activity, able to inspect the code as it changed over the course of a conversation, it will have a record of what stack overflow threads you read while working on a git commit and be able to pull out snippets that were helpful to you

you can train your bot and trade it - this is also Slavi's idea of building out 

Any file you upload, any document or program you write, is immediately available on the network (available to whoever has access to the machine)

# how do you handle permissions

When you're given a key (a cookie bearing your identity) the operator processes spins up a switchboard just for you - that switchboard process is what is actually opening files from disk and executing commands in its own subprocess. This switchboard process is started with a unix uid - so it has priveleges associated with a user account on the unix subsystem. If that user isn't allowed to read a file, then the switchboard running as that user will be denied access. Access errors are piped back to the client as a 500 error.

These keys can be created explicitely by the operator process, or created and retrieved by a chatscript personality, so keys can be given out after asking someone their name, or perhaps you ask a few more questions to make sure this is a person who you want on your machine. See if they can answer a riddle, or the other half of an inside joke, or local trivia only your neighbors will know.




# Operator, Bookkeeper, and Keymaker

**Operator.js connects your calls.**

It is the top level script that does all the process creation and supervising, so once you git clone, you can run 'node operator' to start listening for HTTP requests. It also listens for input on stdin, so once you start the operator, you can still use the shell. Input is piped to the interpret function, explained further down, allowing you to run bash commands, javascript one-liners, or plain English to be replied to by the system's ChatScript personality.

**Bookkeeper.js takes note of every transaction made by the Operator.**

Each user gets a separate log file, including the system itself. System errors are kept in error.log. They are written in JSON for easy interpretation by other programs. Each log includes information about GET/POST/PUT/DELETE request made by that user, how many bytes of data were transfered, along with CPU and RAM usage by that users' Switchboard.

**Keymaker.js sets cookies and reads magic URLs**

By designing a server meant to serve only a few hundred people, I get to cut a big corner in authorization - I don't have to store user sessions in a database. Keymaker simply maps random numbers to user ids. Keymaker also provides the function allowing you to decide what environment variables are set in that users sessions - you can decide what usernames have what unix uids, whether they talk to the bot or can execute arbitrary bash commands, and which directory they're contained in (e.g. what application they are served.)

# Root, Logs, and Spiders
You can think of logs as slices of a branch, an artifact that lets analyze the rings to determine what happened over time. Thankfully for our computer program, we don't have to destroy the tree to read its logs.

If you're familiar with git branches, you'll have to zoom out a bit - a repository may have many branches, but it will at least have a master branch, which implies that there is a larger tree to attach to. The host machine's filesystem is that tree that contains many repos and their master branches.

Spiders are programs that crawl filesystems and computer networks and carry out some task for you. Basic spiders might include, download any new messages from a POP server, fetch the weather.
They can be accessed via POST requests from client side applications or by a ChatScript server, allowing your chatbot to digest data from the wider internet.

# Root: Interpret, Switchboard, and GUI
A switchboard is a lightweight node server spun up on a per-user basis ('guest' or 'nobody' may be a user that represents many different people requesting files).  

If a 'GET' request is made to a directory (like '/' or '/root/gui/blocks/' ) the default figtree is used to serve the terminal interface.
Otherwise, an attempt is made to serve the file requested by the pathname. Relative pathnames are relative to the working directory of the node server right now. Full paths are OK too.
Note that a trailing slash is used to determine that a path represents a directory.


# Root: Convologs, Figtrees, and FigJam
Convologs are JSON files with a single message per line, one file for each user.
This allows the recording and interweaving of messages from many users, so anyone within a particular directory has the option to leave public messages. Chatroom functionality can be had if you connect to a "log watch" program to stream new file changes to you.
Figtrees, short for Configuration Trees, are directed graphs representing the state of a workspace associated with a particular user. The file is read by a client to initialize and position all the blocks a particular user was working on.