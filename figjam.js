/* a figtree is a nested object describing the HTML graph of a document to be rendered when a directory is requested     */
/* The top level properties are head: [array], block: [array], and body: [array]                                         */
/* head and body are arrays of objects of the form {tagName: {attribute: value, attribute: value}}                       */
/* blocks is an array of strings listing, in order, the class names of custom components to stream as dependencies       */
/* a template tag will be rendered for each, encapsulating the css and html for an element                               */
/* this template tag will include attributes keeping track of what source code was available, like:                      */ 
/* <template renders="become-block" has-html="true" has-css="true" has-js="true">                                        */
/* if a node has childNodes, that property is also an array of objects to describe those HTML Elements to be rendered    */
/* {tagName: {a: v, a: v, childNodes:[{tagName: {a: v, a:v}},{tagName: {a: v, a:v}}]}}                                   */
/* note that attribute/value (a/v) are named by you, "childNodes" is the key that figjam.js uses to recurse, so use that */
/* I kinda want to put this in a separate .json file but you cant have comments in json */
let defaultFig = {
    "head": [
        {"meta":{
            /* force the browser to scale the body to the device width, helps with mobile screens */
            "name":"viewport",
            "content":"width=device-width, initial-scale=1"
        }},
        {"meta":{
            /* let the browser know there's utf8 going on */
            "charset":"UTF-8"
        }},
        {"meta":{
            // let the web interface know who this is, just for filling in attributes for 'who'
            "user-identity": process.env.user
        }},
        {"meta":{
            // let the web interface know the process identity so when tab/browser is closed, it can send a kill signal
            "process-identity": process.pid
        }},
        {"link": {
            /* base64 representation of a blank favicon to prevent the browser from asking for nonexistent file */
            "rel":"icon",
            "type":"image/x-icon",
            "href": "data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAAF0lEQVRIx2NgGAWjYBSMglEwCkbBSAcACBAAAeaR9cIAAAAASUVORK5CYII="
        }},
        {"style": {
            "id":"defaultStyle",
            "textContent": `
                * {
                    margin: 0; 
                    padding: 0; 
                    box-sizing: border-box;
                } 
                body, html {
                    overflow: hidden;
                    width: 100%; 
                    height: 100%;
                }`
        }}
    ],
    /* just fyi this array needs to be in the order of inheritence i.e. start with proto, read, go from there */
    /* any element in the blocks list will be registered as a custom compontent, so a class.js must go along with each of these */
    "prereq": ["proto","multiplex"],
    "blocks": ["directory","become","textarea"],
    "frames": ["hsplit","vsplit","thread"],
    "body": [
        {"hsplit-block": {
            childNodes: [{"become-block": { }}]
        }}
    ]
}

const fs = require('fs')
const path = require('path')
const util = require('util')
const rootDirectory = '.' // this might change when we start operator in different places around the computer. maybe it will draw from environemnt variable?

module.exports = async function(request, response){
    response.setMaxListeners(50) // I might open a bunch of files at once, no big deal
    
    var readFile = util.promisify(fs.readFile)
    var fig = await parseFig()
    var buildErrors = []
    response.write(`<!DOCTYPE html><html><head>\n`)
    defaultFig.head.forEach(streamNodes)
    fig.head.forEach(streamNodes)
    response.write(`\n`)
    response.write(`<script> window.defaultFig = ${JSON.stringify(defaultFig)} </script>`)
    
    // Set is an ordered iterable with unique keys. So we set it with the default list of blocks, 
    // and if the figtree also has a list of blocks, add them, but ignore duplicates, and keep the order
    var requisiteBlocks = new Set(defaultFig.prereq.concat(defaultFig.blocks, defaultFig.frames))
    fig.blocks.forEach(block => requisiteBlocks.add(block))
    for(var block of requisiteBlocks){
        await streamBlockTemplate(block)
    }

    response.write(`</head>\n`)
    response.write(`<body>\n`)
    // recursively build tags in body
    // if incoming figtree is empty, use the default body        
    var body = fig.body.length > 0 ? fig.body : defaultFig.body
    body.forEach(streamNodes)
    response.write(`<script>\n`)
    for(var block of requisiteBlocks){
        await streamBlockClass(block)
        response.write('\n')
    }
    response.write(`</script>`)
    if(buildErrors.length){
        response.write(`<build-errors>\n`)
        buildErrors.forEach(error => {
            streamNodes({"build-error": error})
        })
        response.write(`</build-errors>\n`)
    }

    response.write(`</body></html>`) ? response.end() 
                                     : response.once('drain', () => response.end())
    

    /********************* and all the helper functions ***********************/

    function promise2pipe(filename){
        return new Promise((resolve, reject) => 
            fs.createReadStream(filename)
            .on('end', resolve)
            .on('error', readError => resolve(buildErrors.push(readError)))
            .pipe(response, {end: false}))
    }

    async function streamBlockClass(blockName){
        var classFile = path.join(rootDirectory, 'gui-blocks', blockName, 'class.js')
        await promise2pipe(classFile)
        /* follow up class definitioin with element registration */
        /* e.g. customElements.define('read-block', ReadBlock) */
        response.write(`\ncustomElements.define('${blockName}-block', ${blockName.charAt(0).toUpperCase() + blockName.slice(1) + "Block"})\n`)
    }

    async function streamBlockTemplate(blockName){
        // 'this' will be bound to the HTTP Response object, write back to client
        var templateFile = path.join(rootDirectory, 'gui-blocks', blockName, 'template.html')
        var styleFile =  path.join(rootDirectory, 'gui-blocks', blockName, 'style.css')
        response.write(`<template renders="${blockName}-block" filename="${templateFile}">\n`)
        response.write(`<style renders="${blockName}-block" filename="${styleFile}">\n`)
        await promise2pipe(styleFile)
        response.write(`</style>\n`)
        await promise2pipe(templateFile)
        response.write(`</template>\n`) 
    }
    /* streamNodes should probably be upgraded to async and resolve after the buffer is drained, to scale up */
    function streamNodes(nodeDescription){
        // 'this' will be bound to the HTTP Response object, write back to client
        var tagName = Object.keys(nodeDescription)[0]
        var tagObject = nodeDescription[tagName]
        
        var voidElements = ["area","base","br","col","embed","hr","img","input","keygen","link","meta","param","source","track","wbr"]
        response.write(`<${tagName}`)
    
        attributes = Object.keys(tagObject).filter(attribute => !['childNodes','textContent'].includes(attribute))
        for(var attribute of attributes){
            response.write(` ${attribute}="${tagObject[attribute]}"`)
        }
        response.write(`>\n`)                
        
        if(!voidElements.includes(tagName)){
            /* only check for children and write closing tag for normal elements */
            /* void elements can not have closing tag */   
            var childNodes = tagObject.childNodes || []
            // if there's textContent, write it before closing the tag.
            tagObject.textContent && response.write(tagObject.textContent)
            childNodes.forEach(streamNodes)
            response.write(`</${tagName}>\n`)
        }
    }

    async function parseFig(){
        /* first figure out if I was handed a figtree filename or a figurl URLEncoded JSON */
        /* try to parse one of those, and return the result, or the error, or empty        */
        var figtreeMatch = request.url.match(/figtree=(.*?)(?:$|&)/)
        var figUrlMatch  = request.url.match(/figurl=(.*?)(?:$|&)/)
        var figtree = {
            head: [],
            blocks: [],
            body: []
        }

        /* since I'm Object assigning the incoming figtree with empty arrays, and appending the both heads and both blocks, */
        /* an incoming figtree might just describe its body if the default config is fulfills requirements */
    
        try {
            if(figtreeMatch){
                figtreeFilename = decodeURIComponent(figtreeMatch[1])
                Object.assign(figtree, JSON.parse(await readFile(figtreeFilename)))
            } else if(figUrlMatch){
                figurl = decodeURIComponent(figUrlMatch[1])
                Object.assign(figtree, JSON.parse(figurl))
            }
        } catch(figParseError){
            buildErrors.push(figParseError)
            /* maybe the file isn't there, or the URI was malformed, or the JSON was malfromed */
        }
        return figtree
    }
}