const spawn = require('child_process').spawn
const stream = require('stream')
const util = require('util')

module.exports = class Lineworker {

    constructor(request, response){
        try {
            var subprocess = this.fork(request)
        } catch(err){
            // exit constructor, inform client of why request couldn't be forked
            return response.writeHead(500), response.end(util.inspect(err))
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
                // if subprocess is writing JSON to stdout, allow subprocess to dictate event names, otherwise name it stdout
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
            // not acting as an event source? fine, stream back raw output
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
                response.headersSent || response.writeHead(500)
                response.writable && response.end(util.inspect(error))
            })
            subprocess.on('close', (code, signal) => {
                // oh yeah, I wanted to send information about the exit code, but I can only send headers once, and I don't see a way to use trailers, so I guess I just have to eat this info it for now.
                // if process closes with nonzero code, and no data has been sent, writeHead as error
                if(code !== 0){
                    response.headersSent || response.writeHead(500)
                    response.writable && response.end(String(signal || code))
                }
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
        var queryObject = this.querystring2object(request)        
        var cwd = decodeURI(request.url.split('?')[0].split('/').slice(0,-1).join('/') || '/')
        var src = decodeURI(request.url.split('?')[0].split('/').slice(-1)[0]) // may be '' falsey string
        var params = []
        /*  if there's args, push args to array      */
        if(queryObject.args){
            // depending on type of JSON encoded args property, we have to push it differently
            switch(queryObject.args.constructor){
                case String:
                    params.push(queryObject.args); break;
                case Array:
                    params.push(...queryObject.args); break;
                case Object:
                    params.push(JSON.stringify(queryObject.args)); break;            
            }
        }

        if(src == undefined && params.length == 1){
            src = 'sh'
            params.push('-c')
        }

        /* finally, instantiate a child process */
        var child = spawn(src, params, { cwd })
        // is request.body a string or something I can pipe? The dream is to have a URL I can POST to and pipe the requests together
        // child.stdin.write(request.body)
        /* and store it using its pid and starttime as a key, a universal identifier for this machine  */
        child.startTime = Date.now()
        var pidepoch = `${child.pid}+${child.startTime}`
        /* give the child back */
        return child
    }

    querystring2object(request){
        var queryString = request.url.split('?')[1]        
        var argArray = queryString.split('&')
        return argArray.reduce((prev,cur) => {
            var key = decodeURIComponent(cur.split('=')[0])
            var val = decodeURIComponent(cur.split('=')[1])
            prev[key] = tryJSON(val) || val
            return prev
        },{})
    }
}

function tryJSON(string){
    // if it's parseable, return object, 
    // else, return undefined instead of throwing error
    try { return JSON.parse(string) } catch(err){} 
}