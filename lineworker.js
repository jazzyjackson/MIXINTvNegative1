const spawn = require('child_process').spawn
const stream = require('stream')
const util = require('util')


module.exports = class Lineworker {
    constructor(request, response){
    
        try {
            var subprocess = this.fork(request)
        } catch(err){
            response.writeHead(500)
            return response.end(util.inspect(err))
        }
        // this only continues if launching subprocess didn't throw an error
        response.setHeader('pid+epoch', `${subprocess.pid}+${subprocess.startTime}`)

        if(/event-stream/.test(request.headers.accept)){
            response.setHeader('Content-Type', 'text/event-stream')
            let eventStream = new stream.Transform({
                /*** inside this transform `this` refers to the response stream ***/
                objectMode: true,
                transform: function(chunk, encoding, done){
                    if(typeof chunk == 'string'){
                        // send strings as comments, used for heartbeat
                        this.push(`:${chunk}\n\n`) 
                    } else {
                        // send events as key name
                        // receiving eventsource will need to attach 
                        // event listeners to all possible object keys 
                        // in order to react to named events. 
                        // stdout/stderr/error/exit-code is a good place to start
                        this.push(Object.keys(chunk).map(key =>
                            `event:${key}\n`
                          + `data:${JSON.stringify(chunk[key])}\n`).join('\n') 
                          + '\n')
                    }
                    done()
                }
            })
            // if subprocess was successful, pid will be assigned synchronously and we can send it back
            subprocess.pid && eventStream.write({ pid: subprocess.pid }) 
            let heartbeat = setInterval(() => {
                eventStream.write('lub-dub')
            }, 1000)
            subprocess.stdout.on('data', data => {
                eventStream.write(tryJSON(data.toString()) || {stdout: data.toString()})
            })
            subprocess.stderr.on('data', data => {
                eventStream.write(tryJSON(data.toString()) || {stderr: data.toString()})
            })
            subprocess.on('close', (code,signal) => {
                // stop trying to send heartbeats
                clearInterval(heartbeat) // its okay if heartbeat was cleared already
                if(eventStream.writable == false) return null // exit if eventStream is already closed, likely due to being closed on error
                eventStream.end(signal ? {"exit-signal": signal }  // signal might be KILL or TERM or otherwise null
                                       : {  "exit-code": code   }) // if it was falsey, send exit code instead, which may be falsey. 0 is best case scenario
                // and close the connection. 
                // client should close the eventSource when receiving 'close' event,
                // otherwise closing the pipe throws an error clientside
                // and eventSource will attempt to reconnect 
            })
            subprocess.on('error', error => {
                // stop trying to send heartbeats
                clearInterval(heartbeat) 
                eventStream.end(util.inspect(error))
            })
            eventStream.pipe(response)
        } else {
            // possibly can pipe body of incoming POST requests to stdin, not sure if this could be streaming pipes
            // request.pipe(subprocess.stdin) 
            response.setHeader('Content-Type', 'application/octet-stream')
            subprocess.stdout.on('data', data => {
                response.headersSent || response.writeHead(200)
                response.write(data)                
            })
            subprocess.stderr.on('data', data => {
                response.headersSent || response.writeHead(500)                
                response.write(data)
            })
            subprocess.on('error', error => {
                !response.headersSent && response.writeHead(500)
                response.writable && response.end(util.inspect(error))
            })
            subprocess.on('close', (code, signal) => {
                // if process closes with nonzero code, and no data has been sent, writeHead as error
                code !== 0 && !response.headersSent && response.writeHead(500)
                // response.writable && response.end()
            })
        }

        response.on('close', () => {
            console.log("CLOSED ALL OF A SUDDEN")
        })
        response.on('finish', () => {
            console.log("FINISHED ALL OF A SUDDEN")
        })

        response.on('finish', function(){     
            console.log("response closed, stdout state is:")
            console.log("ended?", subprocess.stdout._readableState.ended)       
            console.log("endEmitted?", subprocess.stdout._readableState.endEmitted)       
            // connection dropped, pause stream and unlink listeners
            subprocess.stdout.pause().removeAllListeners('data').unpipe(this)
            subprocess.stderr.pause().removeAllListeners('data').unpipe(this)
            subprocess.removeAllListeners('close')
            // eventSource clientside will fire error event on connection drop
            // it will replace itself with a new eventsource aware of the pid+timeStart key
            // so that it can be reconnected to the pipe
        })
 
    }

    fork(request){
        /* possible invocations via URL             => parameters passed to child_process.spawn
        (cwd), (optional executable), (querystring) => (executable), (array of arguments), (options object)

        /working/directory/?exec=ls&args=-apl1      => ls, ['-apl1'], {cwd: working/directory/}
        /working/directory/?args=ls -apl1           => sh, ['-c','ls -apl1'], {cwd: working/directory/}
        /some/bashscript.sh                         => sh, ['bashscript.sh'], {cwd: some/}
        /some/pythonscript.py/?args=python          => python, ['pythonscript.py'], {cwd: some/}
        /some/script.js?exec=node&args={one: 1}     => node, ['script.js','{one: 1}'], {cwd: some/ }
        /a/validatedscript.py?args={one: 1,two: 2}  => sh, ['validatedscript.py','{one: 1,two: 2}', {cwd: a/}]

        So, convert the queryString into an object called urlArgs with key value pairs extracted: */
        var urlArgs = this.parseArgsFrom(request)
        console.log("urlArgs:", urlArgs)
        /* And create a default object whose values we'll overwrite if provided, extracting cwd and src from the URL */
        var defaultArgs = {
            exec: 'sh',
            cwd: decodeURI(request.url.split('?')[0].split('/').slice(0,-1).join('/') || '/'),
            src: decodeURI(request.url.split('?')[0].split('/').slice(-1)[0]), // may be '' falsey string
        }
        /* overwrite defaultArgs with urlArgs, add an empty array property (dont use params as a parameter yourself) */
        var spawnArgs = Object.assign(defaultArgs, urlArgs, {params: []})
        /* delete the keys from defaultArgs in urlArgs, so urlArgs is empty unless additional keys were provided    */
        /* if exec is sh and there are args, push -c (interpret string) unless there's a src */
        if(spawnArgs.exec == 'sh' && spawnArgs.args && !spawnArgs.src){
            spawnArgs.params.push('-c')
        }
        /*  if there's a src, push src to array       */
        if(spawnArgs.src){
            spawnArgs.params.push(spawnArgs.src)
        }
        /*  if there's args, push args to array      */
        if(spawnArgs.args){
            spawnArgs.params.push(spawnArgs.args)
        }
        console.log("spawning")
        console.log(spawnArgs.exec, spawnArgs.params, { cwd: spawnArgs.cwd })
        console.log("stdin: ", spawnArgs.stdin)
        /* finally, instantiate a child process */
        let child = spawn(spawnArgs.exec, spawnArgs.params, { cwd: spawnArgs.cwd })
        /* and store it using its pid and starttime as a key   */
        child.startTime = Date.now()
        let pidepoch = `${child.pid}+${child.startTime}`
        /* pipe stdin argument to stdin stream of child process */
        if(child.stdin && urlArgs.stdin){
            child.stdin.write(urlArgs.stdin + '\n')
        }
        /* give the child back */
        return child
    }

    parseArgsFrom(request){
        var queryString = request.url.split('?')[1]        
        var argArray = queryString.split('&')
        return argArray.reduce((prev,cur) => {
            var key = decodeURIComponent(cur.split('=')[0])
            var val = decodeURIComponent(cur.split('=')[1])
            prev[key] = val
            return prev
        },{})
    }
}

function tryJSON(string){
    // if it's parseable, return object, 
    // else, return undefined instead of throwing error
    try { return JSON.parse(string) } catch(err){} 
}