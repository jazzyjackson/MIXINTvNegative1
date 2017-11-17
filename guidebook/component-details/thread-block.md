// ok so threading is also a CPU term but this refers to the communication-thread of twitter/reddit/forums etc 

A component pointing to a folder (probably cloning a git repo) and makes a request of 'what files are here' - read permissions may be revoked (or only files that are globally readable are added to the global branch of the git repo) 

But anyway, I make new notes, write new stories, tbey could be plaintext, or markdown, or html by default. Use file extension to broadcast this, but it could be heurestically determined

By default, make them globally unreadable, so only the user that created it can see it


(sort out the home folder situation. I think it would be a simple dichotomy, does a user hitting your server have permissions to see the system root? or are they chrooted )

Use chroot and userid with parameters from keymaker when laucnhing the switchboard process