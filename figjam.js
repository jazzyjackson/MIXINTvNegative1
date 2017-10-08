// requries node 8+ in order to await the streaming of files in order
// like webpack without the pack
// still gzipped on the fly

//parseInt(undefined) is NaN and Boolean(NaN) is false
//so USES_BONES can be unset, or it can be set to 0, or anything that's not a real number, to not use bones.html 
//anyway if you want to force using bones.html just run "USES_BONES=1 node operator"
module.exports = respondFromFigTree
var fs = require('fs'),
    path = require('path'),
    util = require('util')

var defaultFig = {
    "head": {
        "link": {
            /* base64 representation of a blank favicon to prevent the browser from asking for nonexistent file */
            "rel":"icon",
            "type":"image/x-icon",
            "href": "data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAAF0lEQVRIx2NgGAWjYBSMglEwCkbBSAcACBAAAeaR9cIAAAAASUVORK5CYII="
        },
        "meta": [{
            /* force the browser to scale the body to the device width, helps with mobile screens */
            "name":"viewport",
            "content":"width=device-width, initial-scale=1"
        },{
            /* let the browser know there's utf8 going on */
            "charset":"UTF-8"
        },{
            // let the web interface know who this is, just for filling in attributes for 'who'
            "data-identity": process.env.user
        },{
            // let the web interface know the process identity so when tab/browser is closed, it can send a kill signal
            "process-identity": process.pid
        }]
    },
    /* just fyi this array needs to be in the order of inheritence i.e. start with proto, read, go from there */
    "blocks": ["proto","menu","read","message"],
    "body": {
        "become-block": {}
    }
}


function respondFromFigTree(request, response){
    
    response.setHeader && response.setHeader('content-type', 'text/html; charset=utf-8;')
    
    if(parseInt(process.env.RETROGRADE) || process.versions.node < 8){
        return fs.createReadStream('retrograde.html')
                 .on('error', err => { response.writeHead(500); response.end( JSON.stringify(err)) })
                 .pipe(response)
    }

    /* if the previous if block didn't fire and return, then we assume we're on node > 8 */
    /* now we can start using es6y stuff, promisfy and async/await and arrow functions */
    let readFile = util.promisify(fs.readFile)
    let rootDirectory = '.'
    figjam()
    
    async function figjam(){
        let fig = await parseFig()
        // Set is an ordered iterable with unique keys. So we set it with the default list, 
        // and if the figtree also has a list of blocks, add them, but ignore duplicates, and keep the order

        // if incoming figtree is empty, use the default body
        let body = fig.body || defaultFig.body
        response.write(`<html><head>\n`)
        for(var tagName in defaultFig.head){
            buildTag(tagName, defaultFig.head[tagName])
        }
        for(var tagName in fig.head){
            buildTag(tagName, fig.head[tagName])            
        }

        response.write(`<block-templates>\n`)        
        let requisiteBlocks = new Set(defaultFig.blocks)
        fig.blocks.forEach(block => {
            requisiteBlocks.add(block)
        })
        for(var block of requisiteBlocks){
            await buildBlockTemplate(block)
        }
        response.write(`</block-templates>\n`)
        response.write(`</head>\n`)
        response.write(`<body>\n`)
        // recursively build tags in body

        // buildBlockClasses
        response.end(`</body></html>`)

    }
    
    async function buildBlockTemplate(blockName){
        var templateFile = path.join(rootDirectory, 'gui-blocks', blockName, 'template.html')
        var styleFile =  path.join(rootDirectory, 'gui-blocks', blockName, 'style.css')
        response.write(`<template renders="${blockName}-block" filename="${templateFile}">\n`)
        response.write(`<style renders="${blockName}-block" filename="${styleFile}">\n`)
        await promise2pipe(styleFile)
        response.write(`</style>\n`)
        await promise2pipe(templateFile)
        response.write(`</template>\n`)
    }
    
    async function buildTag(tagName, tagObject){
        if(Array.isArray(tagObject)){
            tagObject.map(tagObjectElement => buildTag(tagName,tagObjectElement))
        } else {
            response.write(`<${tagName} `)
            for(attribute in tagObject){
                response.write(`${attribute}="${tagObject[attribute]}" `)
            }
            response.write(`></${tagName}>\n`)
            
        }
    }
    
    async function parseFig(){
        /* first figure out if I was handed a figtree filename or a figurl URLEncoded JSON */
        /* try to parse one of those, and return the result, or the error, or empty        */
        var figtreeMatch = request.url.match(/figtree=(.*?)(?:$|&)/)
        var figUrlMatch  = request.url.match(/figurl=(.*?)(?:$|&)/)
        var figtree = {
            head: {},
            blocks: [],
            body: {}
        }

        try {
            if(figtreeMatch){
                figtreeFilename = decodeURIComponent(figtreeMatch[1])
                Object.assign(figtree, JSON.parse(await readFile(figtreeFilename)))
            } else if(figUrlMatch){
                figurl = decodeURIComponent(figUrlMatch[1])
                Object.assign(figtree, JSON.prase(figurl))
            }
        } catch(figParseError){
            /* maybe the file isn't there, or the URI was malformed, or the JSON was malfromed */
            figtree.head.meta = {
                "name": "figParseError",
                "content": util.inpsect(figParseError)
            }
        }
        return figtree
    }

    function promise2pipe(filename){
        return new Promise((resolve, reject) => {
            fs.createReadStream(filename)
                .on('end', resolve)
                .on('error', error => {
                    /* if the file doesn't exist that's fine, keep going */
                    error.code == 'ENOENT' ? resolve() : reject(error)
                })
                .pipe(response, {end: false})
        })
    }
}