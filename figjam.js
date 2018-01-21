const fs = require('fs')
const path = require('path')
const util = require('util')
const rootDirectory = process.env.AUBIHOME || '.' 

// resolve after serially resolving promises, unlike Promise.all which executes in parallel
// used for Depth First recursion on reading graphs of dependencies, async opening files
// thanks to https://stackoverflow.com/questions/37576685/ */
Array.prototype.asyncForEach = async function(callback){
    for (let index = 0; index < this.length; index++) {
        await callback(this[index], index, this)
    }
}
// in order to inject a JSON stringified string literal with proper escaping to client
// thanks to https://stackoverflow.com/questions/18273687/
String.prototype.toLiteral = function() {
    var dict = {'\b': 'b', '\t': 't', '\n': 'n', '\v': 'v', '\f': 'f', '\r': 'r'};
    return this.replace(/([\\'"\b\t\n\v\f\r])/g, function ($0, $1) {
        return '\\' + (dict[$1] || $1);
    });
}
String.prototype.camelify = function(){
    return this.replace(/^\w/, firstLetter => firstLetter.toUpperCase()) + 'Block'
}
String.prototype.kabobify = function(){
    return this + '-block'
}
/* if file doesn't exist, resolve null, else resolve when file is known to be readable */
let getReadStreamOrNull = filename => new Promise(resolve => {
    let stream = fs.createReadStream(filename)
    stream.on('error', () => { resolve(null) })
    stream.on('readable', () => { resolve(stream) })
})
/* try to read and parse files in /figs/ directory, or return failure object */
let parseFig = filename => new Promise(resolve => {
    fs.readFile(path.join(rootDirectory, 'figs', filename), (readErr, data) => {
        if(readErr){
            resolve({failure: readErr})
        } else try { 
            resolve(JSON.parse(data)) 
        } catch(JSONerror) {
            resolve({failure: JSONerror}) 
        }
    })
})

async function buildTemplateArray(genetics){
    var templates = []
    var names = []

    /* top level of genetics.json is a json array like 
     * [
     *   { proto: {descendents: [...]},
     *   { menu: true}
     *   { multiplex: {descendents: [...]}}
     * ]
     * And to get ready to stream files we need to open files, an async operation
     * So this recurses over the descendents properties, opens files if they exist,
     * and resolves once all the files (html/css/js) are open.
     * These files are going to be converted to template tags and script tags
     * Since most elements inherit from other elements, it's necessary to append 
     * the "customElements.define" functions in order of inheritance
     * So while we're recusring and opening files for reading,
     * We're also consturcting an array of block names in the right order (Depth First Search -> array of elements)
     * So within the callback function defined here, my {"tagname":attrObj} objects are pushed serially to the array
     * Because they're going to be serially streamed as HTML tags to the client 
     * This could easily be 50+ files, so we might change the upper bound on a warning message meant to alert you to file descriptor leaks */

    await genetics.asyncForEach(async function pushTemplates(guiblock){
        var tagName = Object.keys(guiblock)[0]
        var attrObj = guiblock[tagName]
        var prefix = path.join(rootDirectory, 'gui-blocks', tagName)
        /* - don't read this block unless its truthy. non-empty blocks can be deactivated with {active: false} property */
        if(attrObj == false || attrObj.active == false) return null 
        /* - Not every gui-block has js, css, and html associated with it. It may simply be a class.js other blocks inherit from
         * - Responding to asynchronous error events when the file didn't exist was a problem, 
         *   and Node.js docs recommend responding to error instead of performaing fs.stat to check if a file exists
         * - so getReadStreamOrNull resolves on 'readable' event when file exists, or 'error' if file doesn't exist. 
         * - If file didn't exist, promise resolves to null, so textContent is assigned to null, so nothing gets written to client response
         * */
        names.push(tagName)
        // this could be done in parallel, but its a very fast 'file open' operation, not reading any bytes yet, so its not worth the complexity
        var js   = await getReadStreamOrNull(path.join(prefix, 'class.js'))
        var css  = await getReadStreamOrNull(path.join(prefix, 'style.css'))
        var html = await getReadStreamOrNull(path.join(prefix, 'template.html'))
        
        templates.push({"script": {
            "defines": tagName.camelify(),
            // pull source filename to clientside so I can retrieve and edit if desired, or just help someone find where this code comes from
            "code": js && path.join(prefix, 'class.js'),
            "textContent": js
        }})
        templates.push({"template": {
            "styles": tagName.camelify(),
            "childNodes": [
                {"style":{
                    // if css is not null, drop in the filename that is being streamed
                    "code": css && path.join(prefix, 'style.css'),
                    "textContent": css
                }}
            ]
        }})
        templates.push({"template": {
            "marksup": tagName.camelify(),
            "code": html && path.join(prefix, 'template.html'),
            "textContent": html
        }})
        // Check that descendents property exists + is an Array 
        if(Array.isArray(attrObj.descendents)){
            // and recursively call this function to append all the templates in order
            await attrObj.descendents.asyncForEach(pushTemplates)
        }
    })

    return {
        templates,
        names
    }
}

async function streamNodes(nodeDescription){
    // 'this' will be bound to the HTTP Response object, write back to client
    var tagName = Object.keys(nodeDescription)[0]
    var attrObj = nodeDescription[tagName]
    /* list of elements that can't have closing tags or child elements, via spec: https://developer.mozilla.org/en-US/docs/Glossary/Empty_element */
    var voidElements = ["area","base","br","col","embed","hr","img","input","keygen","link","meta","param","source","track","wbr"]

    let attributes = Object.keys(attrObj)
                           .filter(attr => !['childNodes','textContent'].includes(attr))
                           .map(attr => ` ${attr}="${attrObj[attr]}"`)
                           .join('')
    /* write opening tag */
    this.write(`<${tagName}${attributes}>`)
    /* - if tag name was on the list of void elements, this gets skipped and the next node is streamed
     * - if you used one of these reserved words for a custom element in genetics.json, the file won't be read but will be kept open, so don't.
     * - textContent for templates will be readStreams via fs.createReadStream
     * - 
     * */
    if(!voidElements.includes(tagName)){
        await new Promise(resolve => {
            if(!attrObj.textContent){                
                resolve() 
            } else if(attrObj.textContent.pipe){
                attrObj.textContent.on('end', resolve).pipe(this, {
                    end: false /* resolve when textContent is done, but don't end the response */
                })
            } else {
                this.write(attrObj.textContent, resolve)                
            }
        })
        /* - recursively stream any elements that exist as child nodes
         * - if no childNodes, asyncForEach resolves empty array immediately
         * - after resolving asyncForEach, write the closing tag and continue */
        var childNodes = attrObj.childNodes || []
        await childNodes.asyncForEach(streamNodes.bind(this))        
        this.write(`</${tagName}>\n`)
    }
}

module.exports = async function(request, response){
    // parse URL for fig path. localhost:3000/figs/aubibrain will return an admin panel, /figs/unkown will return error message, no figs will return default.json
    var urlParts = request.url.split('/')
    var figIndex = urlParts.indexOf('figs') + 1
    // if figs wasn't an url component, indexOf returns -1, +1 becomes 0, which is falsey, 
    // so figName <- default, otherwise use url component to the rights of /figs/
    var figName = figIndex ? urlParts[figIndex] : 'default'
    var figPromises = []
    /* parseFig returns a promise to read and parse a json object. If file doesn't exist or json parsing fails, you'll just get {failure} object */
    figPromises.push(parseFig('default.json'))
    /* if there was a custom fig requested, push that promise */
    figIndex && figPromises.push(parseFig(figName + '.json'))
    /* this would be a good place to also merge a figurl passed in qeuery string */
    figObjects = await Promise.all(figPromises) // [{head, body},{head, body}]
    /* merge objects, overriding fig[0] with fig[1], could be a more intelligent merge in the future, now its just blunt replace top level property */
    var figTree = Object.assign(...figObjects)

    /* add a meta tag to dump all environment variables to client */
    var environmentGlobal = {
        /* name is used to fetch this meta tag, overwrite any env variable named 'name' */
        "script":  {
            "id":"environment",
            "textContent": `window.env = JSON.parse(\`${JSON.stringify(process.env).toLiteral()}\`)`
        }
    }
    /* guiBlockTemplates is going to be an array of {template: {textContent}} objects, where textContent is actually a readStream */
    /* so you've got an array containing many (like 50 or so) read streams that will be resolved as file content is piped to client */

    //console.log(guiBlockTemplates)

    // guiBlocks.names
    // guiBlocks.nodeDescriptions

    var genetics = await parseFig('genetics.json')
    // could perform consistency check here if I wanted to have useful error messages
    // make sure top level is an array, make sure I can descend the tree and not run into anything unexpected...
    // right now errors will get swallowed into promise purgatory
    var guiBlocks = await buildTemplateArray(genetics)
    
    var figTreeGenetics = {"script":{
        "id":"genetics",
        "textContent": `window.genetics = JSON.parse(\`${JSON.stringify(genetics).toLiteral()}\`)`
    }}
    
    var customElementRegistration = {"script":{
        "id": "element-registration",
        "textContent": guiBlocks.names.map(block => {
            // blockNames looks like ['proto','become','library','bashio','convoshell'] etc      
            // needs to be customElements.define('proto-block', ProtoBlock)
            return `customElements.define("${block.kabobify()}", ${block.camelify()})`
        }).join('\n')
    }}

    // figTree bundle is an array of objects where each object is {name: [{array of objects}]}
    //console.log(figTree.head)
    //console.log()

    figTree.head.childNodes = figTree.head.childNodes.concat(environmentGlobal)
                                                     .concat(figTreeGenetics)
                                                     .concat(guiBlocks.templates)
                                                     .concat(customElementRegistration)
    // gets called recursively on JSON graph to stream markup to client, response object referenced here
     
    await streamNodes.call(response, {
        html: {
            childNodes: [
                { head: figTree.head },
                { body: figTree.body }
            ]
        }
    })
    response.end()
}