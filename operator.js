let http           = require('http') 
let keymaker       = require('./keymaker')
let bookkeeper     = require('./bookkeeper')
let child_process  = require('child_process')

if(process.env.DISABLE_SSL){
    console.log("DISABLE_SSL is declared in this environment, ignoring key and cert files and starting server as HTTP.")
} 
console.log("using env", process.env)
console.log("using path", process.env.PATH)

var keycert = {
    key: '', // file path to key file
    cert: '', // file path to cert file
}
// if key and cert don't exist, trySSL returns false, server starts as HTTP
var SSL_READY = keymaker.trySSL(keycert)
let switchboards = new Object
/* check if private key and certificate were read properly and start server  */ 
require(SSL_READY ? 'https' : 'http')
.createServer(SSL_READY && keycert)
.on('request', async (request, response) => {
    await keymaker.identify(request, response)
	if( request.profile.id == undefined ){
        /* unauthenticated healthchecks are ok, but close the connection right away */
        if(request.url == '/healthcheck') return response.end(JSON.stringify({health: "OK"}))
        /* if keymaker was unable to identify a request, redirect to prescribed location, presumably a place they can get an ANsid */
        response.writeHead(302, { 'Location': keymaker.authRedirect })
        response.end()
    } else if(request.url.includes('ANsid=')){
        /* if a request has an identity but also has magicurl in its querystring, 
           redirect to requested pathname minus the query string - entirely cosmetic */
        response.writeHead(302, { 'Location': request.url.split('?')[0] })
        response.end()
    } else {
        // pass request and response streams to bookkeeper, get back transform pipes that log things for us 
        let {watchRequest, watchResponse} = bookkeeper.observe(request, response)
        // try to retrieve switchboard registered for this identity,
        // if that key returns undefined, then invoke asynchronous registerSwitchboard for new id
        let promise2serve = switchboards[request.profile.id] || (switchboards[request.profile.id] = registerSwitch(request))
        let proxyDestination = await promise2serve
        if(proxyDestination){
            request.pipe(watchRequest).pipe(http.request({
                hostname: proxyDestination.hostname,
                port: proxyDestination.port,
                path: request.url,
                headers: request.headers,
                method: request.method,
                agent: false
            }, proxyResponse => {
                response.writeHeader(proxyResponse.statusCode, proxyResponse.headers)
                proxyResponse.pipe(watchResponse).pipe(response)
            }))
        } else {
            bookkeeper.logError('operator','promise2serve resolved to undefined value!')
        }
    }
}).listen(process.env.PORT || 3000).on('listening', function(){ console.log("Started an operator on port", this.address().port) })
/* it would be fun to open a port for making new sessions. spin up an internal http server, listen for requests from chatscript ... if switchboard is started in the same shell as chatscript, they can communicate with environment variables create an switchboard as a username, make a magic url, send JSON back to chatscript, eval location.pathname += ?magicurl=$magicurl */
/* then suddenly you can write chatscript sphinxes that let you log on once you answer some questions */

function registerSwitch(request){
    // constructs a promise, assigns it to this[id], returns this[id]
    return new Promise((resolve, reject) => {
        // TO DO: start child process using identity this request, something like sudo -u ${identity} sh -c command 
        // check if user exists on system, useradd otherwise - what about passwords? not sure.
        // https://askubuntu.com/questions/294736/run-a-shell-script-as-another-user-that-has-no-password
        // only files that this identity has permission to read will be served and execute
        // groups will be an array, interpolated it will be stringified, so ['one','two','three'] becomes 'one,two,three', perfect for passing to xargs and useradd
        let makeYourselfAtHome = child_process.spawn('make',[
            `yourself-at-home`,
            `identity="${request.profile.id}"`,
            `groups="${request.profile.roles}"`,
            /* fullname will be used as comment and home folder */
            /* replace nonword characters (\W) with nothing to get an easy ASCII string for home folder */
            `fullname="${request.profile.fullName}"`
        ])
        makeYourselfAtHome.stdout.on('data', data => {
            bookkeeper.appendLog('switchboard','message', data)
            // console.log(data.toString())
        })
        makeYourselfAtHome.stderr.on('data', data => {
            bookkeeper.appendLog('switchboard','message', data)
            // console.log(data.toString())
        })
        makeYourselfAtHome.on('error', err => {
            bookkeeper.appendLog('switchboard','error', data)
            // console.log(err.toString())
            reject(err.toString())
        })
        makeYourselfAtHome.on('close', () => {
            console.log("request profile like", request.profile)
            console.log("environment is", process.env)
            // now this identity will have a home folder just for them, so 
            // find the sudo environment and stick python path in there.
            let switchboard = child_process.spawn('sudo', [
                'PYTHONPATH=' + process.env.PYTHONPATH, // PATH gets overwritten by sudo path ??
                '-E', /* keep environment variables */
                '-u', /* execute switchboard as another user */
                request.profile.id, /* this user, as a matter of fact */
                './switchboard.js', /* this file runs as a standalone executable */
                '0'],{ /* pass 0 to switchboard to request unallocated local port */
                env: Object.assign(request.profile, {
                    DISABLE_SSL: true,
                    PYTHONUNBUFFERED: true,
                    BOT: process.env.BOT,
                    PATH: process.env.PATH, // PATH gets overwritten by sudo path ??
                    FULLNAME: request.profile.fullName,
                    APPROOT: process.env.APPROOT,
                    /* hate to block the thread for a millisecond here, but this only happens when a new server is established,
                        and I want to have these id # to be available for reference on the client side, these get baked into meta tags by figjam.js */
                    GIDS: child_process.execSync(`sudo -u ${request.profile.id} id -G`).toString().trim(),
                    UID: child_process.execSync(`sudo -u ${request.profile.id} id -u`).toString().trim(),
                    // HOME: `/aubi/id/${request.profile.fullName || 'nobody'}`
                })
            }) // call for an switchboard on port 0, system will assign available port
            switchboard.stdout.on('data', port => {
                console.log("message from switchboard", port.toString()) // first output from switchboard should be the port its assigned
                                                // further messages like uncaught exceptions will also be passed to console
                resolve({
                    // keep a reference to the child_process so it can be killed or inspected
                    process: switchboard,
                    // switchboard.js will print the port it's assigned by the system
                    port: parseInt(port.toString()),
                    // you could conceivably use registerSwitchboard to spawn a switchboard on a remote machine and 
                    // return its IP address here, but right now everything happens on localhost
                    hostname: 'localhost'
                })
            })
            switchboard.stderr.on('data', data => {
                console.log('stderr from switchboard', data.toString())
                reject(data.toString())
            })
            switchboard.on('error', error => {
                console.log('error from switchboard', error.toString())
                reject(error.toString())
            })
        })
    })
}

// use 4444 for internal or debugging use, right now it will run on root so keymaker and chatscript can access and run things unrestricted - would be nice to lock that down in the future.
let internalServer = child_process.spawn('./switchboard.js', ['4444'])
internalServer.stdout.pipe(process.stdout)
internalServer.stderr.pipe(process.stderr)
internalServer.on('error', console.error)