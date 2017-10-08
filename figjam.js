// requries node 8+ in order to await the streaming of files in order
// like webpack without the pack
// still gzipped on the fly

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
        "become-block": {
            "width":"400px",
            "height":"300px",
            "style":"background:pink;display:block;",
            "childNodes": {
                "div": [{
                    "childNodes": {
                        "ul":{
                            "childNodes": {
                                "li":[{"textContent":"1"},{"textContent":"2"},{"textContent":"3"}]
                            }
                        }
                    }
                },{},{}]
            }
        }
    }
}


function respondFromFigTree(request, response){
    response.setMaxListeners(50) // I might open a bunch of files at once, no big deal
    /* if the previous if block didn't fire and return, then we assume we're on node > 8 */
    /* now we can start using es6y stuff, promisfy and async/await and arrow functions */
    let readFile = util.promisify(fs.readFile)
    let rootDirectory = '.'
    figjam()
    
    async function figjam(){
        let fig = await parseFig()

        response.write(`<html><head>\n`)
        for(var tagName in defaultFig.head){
            buildTag(tagName, defaultFig.head[tagName])
        }
        for(var tagName in fig.head){
            buildTag(tagName, fig.head[tagName])            
        }


        // Set is an ordered iterable with unique keys. So we set it with the default list of blocks, 
        // and if the figtree also has a list of blocks, add them, but ignore duplicates, and keep the order
        let requisiteBlocks = new Set(defaultFig.blocks)
        fig.blocks.forEach(block => {
            requisiteBlocks.add(block)
        })
        for(var block of requisiteBlocks){
            await buildBlockTemplate(block)
        }

        response.write(`</head>\n`)
        response.write(`<body>\n`)
        // recursively build tags in body
        // if incoming figtree is empty, use the default body        
        var body = Object.keys(fig.body).length > 0 ? fig.body : defaultFig.body
        for(var tagName in body){
            buildTag(tagName, body[tagName])            
        }
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
    
    function buildTag(tagName, tagObject){
        // list of elements that should be 
        
        var voidElements = ["area","base","br","col","embed","hr","img","input","keygen","link","meta","param","source","track","wbr"]

        if(Array.isArray(tagObject)){
            tagObject.map(tagObjectElement => buildTag(tagName,tagObjectElement))
        } else {
            response.write(`<${tagName} `)

            attributes = Object.keys(tagObject).filter(attribute => !['childNodes','textContent'].includes(attribute))
            for(var attribute of attributes){
                response.write(`${attribute}="${tagObject[attribute]}" `)
            }
            response.write(`>\n`)                
            
            if(!voidElements.includes(tagName)){
                /* only check for children and write closing tag for normal elements */
                /* void elements can not have closing tag */   
                var childNodes = tagObject.childNodes || {}
                // if there's textContent, write it before closing the tag.
                tagObject.textContent && response.write(tagObject.textContent)
                for(var childName in childNodes){
                    buildTag(childName, childNodes[childName])
                }
                response.write(`</${tagName}>\n`)
            }
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
                Object.assign(figtree, JSON.parse(figurl))
            }
        } catch(figParseError){
            /* maybe the file isn't there, or the URI was malformed, or the JSON was malfromed */
            figtree.head.meta = {
                "name": "figParseError",
                "content": util.inspect(figParseError)
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