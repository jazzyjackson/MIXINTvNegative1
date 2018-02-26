Websocketed codemirrors were actually pretty annoying
So I like the idea of a convoshell[party] with a codemirror target:
Basically on every incoming message, check codemirror isDirty property
If I haven't made local, unsaved changes, and something happens in the chat, just hit the server with an options request, get 'lastModified' on the source file, re-get if there's been an update.

Or, alternatively, the codemirror can have a target convoshell to send updates on. 
"user234 has committed a change to sdfkj.txt" and if you also have sdfkj.txt open, and havent made changes, then it will re-get.

Before saving to disk - you have your local 'last-gat' time, check if there's a newer version on disk. If there is, git checkout editmerge, git merge master, send the conflict back to codemirror, parse the <<<<>>>>, and ask to re-save. On the next PUT, check if merge is complete and merge back to original branch...

git gat get got gut
gat -> git status
get -> git pull
got -> git log
gut -> git push