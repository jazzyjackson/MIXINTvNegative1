let keymaker      = require('./keymaker')
let child_process = require('child_process')
let http          = require('http')
// operatorRegistry is just a key:value store with a method for 
class operatorRegistry {
    constructor(){
        this.registerOperator('default')
    }

    // sticking it as a static method so require is only called once and used by all instances
    registerOperator(identity){
        // constructs a promise, assigns it to this[id], returns this[id]
        return this[identity] = new Promise((resolve, reject) => {
            // TO DO: start child process using identity this request, something like sudo -u ${identity} sh -c command 
            // https://askubuntu.com/questions/294736/run-a-shell-script-as-another-user-that-has-no-password
            // only files that this identity has permission to read will be served and execute
            let server = child_process.spawn('./operator.js', [0]) // call for an operator on port 0, system will assign available port
            server.stdout.on('data', port => {
                resolve({
                    // keep a reference to the child_process so it can be killed or inspected
                    process: server,
                    // operator.js will print the port it's assigned by the system
                    port: parseInt(port.toString()), 
                    // you could conceivably use registerOperator to spawn a server on a remote machine and 
                    // return its IP address here, but right now everything happens on localhost
                    hostname: 'localhost'
                })
            })
            server.stderr.on('data', reject)
            server.on('error', reject)
        })
    }
}

let operators = new operatorRegistry

/* assigns operators.default a promise to listen. get port with (await operators.default).port, pid by (await operators.default).process.pid */

http.createServer(async (request, response) => {
    await keymaker.identify(request, response)
	if( request.id == undefined ){
        /* if keymaker was unable to identify a request, redirect to prescribed location, presumably a place they can get a magicurl */
        response.writeHead(302, { 'Location': keymaker.authRedirect })
        response.end()
    } else if(request.url.includes('magicurl=')){
        /* if a request has an identity but also has magicurl in its querystring, 
           redirect to requested pathname minus the query string - entirely cosmetic */
        response.writeHead(302, { 'Location': '//' + request.url.split('?')[0] })
        response.end()
    } else {
        /* if an operator was never created for this identity, fine, use the default operator */
        let proxyDestination = await (operators[request.id] || /* operators.registerOperator(request.id) || */ operators['default'])
        request.pipe(http.request({
            hostname: proxyDestination.hostname,
            port: proxyDestination.port,
            path: request.url,
            headers: request.headers,
            method: request.method,
            agent: false
        }, proxyResponse => {
            response.writeHeader(proxyResponse.statusCode, proxyResponse.headers)
            proxyResponse.pipe(response)
        }))
    }
}).listen(process.env.PORT || 5000)
/* it would be fun to open a port for making new sessions. spin up an internal http server, listen for requests from chatscript ... if switchboard is started in the same shell as chatscript, they can communicate with environment variables create an operator as a username, make a magic url, send JSON back to chatscript, eval location.pathname += ?magicurl=$magicurl */
/* then suddenly you can write chatscript sphinxes that let you log on once you answer some questions */