

/*
switchboard.js is a reverse-proxy, load balancer, file cache, and monitoring program to pair with operator.js

switchboard.js acts as a single point of entry on whatever port its running on and can manage processes 

on request of /, if no auth, have a flag to redirect to SSO or a particular sphinx-figtree
otherwise, get requests to files and post requests are honored with no auth, whatever you have your permissions set for man
but here's still a good place you can just refuse whatever request you want. Maybe sphinx is an identity that can make POST requests but is in a sphinx jail with no files.

really looking forward to handling sites (with different domains) as BSDjails
users (including nobodies) log into operators that are running within a particular sites jail

so the root user can see all the jails, but the sites cant see each other. 
this will hopefully allow small scale administrators to host many neighborhood groups
"bring the bulletin boards back to the neighborhood" - your local sysadmin

bunch of crazy ideas (first draft) for cache
'get figtree' reads your file or figurl and gives you a minimal HTML graph with a script src=123hashofthefig456
and that request can happen without reading 

have a Set of filename
when a resource is requested, add the filename+username, set a timeout (30s ?) to remove the filename
that's probably wideopen for some kind of rollover hack, but if it grabs username from cookie... salt/hash the cookies so they cant be modified by clients...

(can I Map filenames to timeouts? so I can clearTimeout and setTimeout on repeat requests)
recentRequests = new Set
PUT requests to a filename should flush the cache

on timeout, if memory usage is below some threshold (20% ?) then set another timeout to check again in a minute

cachedRequests = new Set

on request, if recentRequests.has(request), reset the timeout to a higher value if you want
more importantly, if the size of the request is less than a threshold (1/50th available ram or something? do some math based on historical usage and try to adjust)

if cachedRequests.has(request), stream the response back.


keep ongoing read outs of memory usage and traffic and all
every 10 seconds append to disk or whatever

*/