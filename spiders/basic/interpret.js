var net = require('net')
var util = require('util')
var os = require('os')

var port = process.env.CSPORT || 1024
var host = process.env.CSHOST || 'localhost'
var identity = process.env.identity || 'unknown' /* not to be confused with 'nobody' */
var botname = process.env.botname || 'harry'

var chat = message => new Promise((resolve, reject)=> {
    var client = net.createConnection({port: port, host: host})
    var buffers = []
    client.on('connect', () => client.write([identity,botname,message].join('\0') + '\0'))
    client.on('data', data => buffers.push(data))
    client.on('error', error => reject(error))
    client.on('end', () => resolve(Buffer.concat(buffers).toString().trim()))
})

function tryJSON(string){
    // if response from chatscript is valid json, I'll have an object ready to go, otherwise just a string is fine
    try {
        return JSON.parse(string)
    } catch(e) {
        return string
    }
}

process.stdin.on('data', input => {
    // input is freshley decoded base64 string from client, which must have been JSON encoded before being converted to base64
    // base64 is necessary to pass special characters along to chatscript since I'm invoking chatscript as a child process, shell and all
    try {
        chat(JSON.parse(input.toString()))
        .then(response => {
            var responseObj = tryJSON(response)
            var string = typeof responseObj == 'object' ? JSON.stringify(responseObj)
                                                        : JSON.stringify({stdout: responseObj})
            process.stdout.write(string)   
        })
        .catch(error => {
            process.stderr.write(util.inspect(error))
        })
    } catch(e){
        process.stderr.write("I'm expecting JSON input on stdin, for example:\necho '\"Hello World\"' | node interpret\n")
    }
})