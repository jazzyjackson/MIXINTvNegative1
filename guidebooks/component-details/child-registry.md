Poly-Int provides two possibilities for executing programs: 
- a 'raw' interface that pipes the request to stdin and the response to stdout
- as server sent events (SSE), each write to stdout or stderr will fire an event.

In either case, executing the program is done via form encoded

exec=sh&args=URLENCODEDSTRINGORJSON
exec=python&arg1=something&arg2=somethingelse

(sh is default executable)

If there is an args property, the string will be passed on as is to the executable.
The url path is used as the cwd. If it ends with a trailing slash, and there's an exec property, 

/spiders/basic/?exec=ls&args=-apl1

Will execute ls -apl1 in the /spiders/basic/ directory, and you'll get a list of files
If exec is not provided, it defaults to 'sh'

If the url path does not end in a trailing slash, the remainder of the path will be used as the first argument to the executable, so if a POST request is made to

/spiders/basic/somescript.sh, switchboard.js will spawn a child process of:
sh somescript.sh
with a cwd of /spiders/basic/, 