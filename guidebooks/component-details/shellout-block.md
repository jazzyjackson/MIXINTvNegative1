A convenient, minimimal but highly extensible interface for handle server sent events.

Given an action

attributes include

src
exec
args

exec defaults to sh
if args is provided, thats used

so,

/current/working/directory/?exec=ls&args='-apl1'
looks like, `ls -apl1`

but if you just want to run a shell command like "tail -f somefile.txt" you can just pass an args string:
/some/directory/?args="tail -f somefile.txt"
and the command will look like `sh -c 'tail -f somefile.txt'`
                                tail 
