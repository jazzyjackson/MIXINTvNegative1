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

process.stdin.on('data', input => {
    // assign input to heard, whether or not it's enclosed in quotes (valid JSON)
    try {
        var heard = JSON.parse(input.toString())
    } catch(e){
        var heard = input.toString()
    }
    // input is freshley decoded base64 string from client, which must have been JSON encoded before being converted to base64
    // base64 is necessary to pass special characters along to chatscript since I'm invoking chatscript as a child process, shell and all
    chat(heard)
    .then(response => {
        try {
            // lol just see if parse doesn't throw an error and put it back
            process.stdout.write(response)
        } catch(e) {
            // if it didn't parse, wrap it in a little JSON object before sending it back
            process.stdout.write(JSON.stringify({say: response}))
        }
    })
    .catch(error => {
        process.stderr.write(util.inspect(error))
    })
})