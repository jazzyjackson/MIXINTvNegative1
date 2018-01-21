/* ProtoBlock has no style or template, 
it's only meant to hold the utility methods that all blocks are expected to inherit. 
There is no custom element. no document.createElement('proto-block'), just, class extends ProtoBlock */

class ProtoBlock extends HTMLElement {
    constructor(props){
        super()
        this.props = props
    }
    /* ProtoBlock calls every class's init method, do not overwrite the 'connectedCallback' method on descendent classes, put it all in an 'init' function */
    connectedCallback(){        
        if(this.readyState != undefined){
            // if the readState property has been set already, then exit: connectedCallback was called repeatedly
            return this.dispatchEvent(new Event('reconnect'))
        }
        this.readyState = 'loading'
        this.superClassChain.forEach(superclass => {
            if(superclass.hasOwnProperty('ready')){
                superclass.ready.call(this)
            }
        })
        // if there is a src, be 'interactive' and wait until whatever function is responsible for loading it fires 'load'
        // if, for instance, src is set on an img tag in shadowRoot, the load event will have to be retargeted to the host element
        // if there's no source
        this.readyState = this.props.src ? 'interactive' : 'complete'
        // this deviates from the document standard, where readyStateChange->complete fires BEFORE load, here load will fire and trigger readyStateChange. sorry.
        this.addEventListener('load', () => { this.readyState = 'complete' })      
    }
    
    disconnectedCallback(){
        this.superClassChain.forEach(superclass => {
            superclass.destroy && superclass.destroy.call(this)
        })
    }


    // called in order from proto -> descendant. When connected to the DOM, all the init functions are called, then all the ready functions are called
    // keep in mind that ready will be called before the ready statement of each descendent
    // so it would be good not to lean on the minimalist side of things - externalize functionality into instance methods so you can overwrite them in descendents. code in ready block can't be disabled/overwritten by descendants.
    static ready(){
        /* not really static, always called with the context of actualy DOM node 
        /* but made static so it can be retrieved from class definition (returned in superclasschain) 
        /* ready sequence for all descendants of proto block 
         * - locate HTML template that renders this block
         * - locate CSS templates for all classes in superClassChain
         * - create a shadowRoot with the HTML template as innerHTML
         * - inject all the style tags (each with a reference to their filename by the way) into shadowroot */
        this.attachShadow({mode: 'open'})
        // append the clone of every style template for each block in superclasschain
        this.superClassChain.forEach(superclass => {
            let style = document.querySelector(`template[styles="${superclass.name}"]`)
            style && this.shadowRoot.appendChild(style.content.cloneNode(true)) 
        })
        // clone contents of html template for this block
        var template = document.querySelector(`template[marksup="${this.constructor.name}"]`)
        this.shadowRoot.appendChild(template.content.cloneNode(true))
        // allow instant reference to any uniquely named child (descriptive custom tags are encouraged) as this.child[tagname]
        // basically as a shortcut as this.shadowRoot.querySelector('tagname') for brevity and reducing lookups
        this.child = Array.from(this.shadowRoot.querySelectorAll('*'), child => {
            /* enhanced object literal dynamically names object keys */
            return {[child.tagName.toLowerCase()]: child}
            /* from an array of objects, reduce to one object of all keys */
        }).reduce((a,b) => Object.assign(a,b),{})
        // set a reference to this elements parent, if there's a shadowRoot between here and there
        this.shadowParent = this.getRootNode().host

        this.loadLocalStyle('/gui-blocks/proto/assets/museoStyle.css')

    }

    /* get actions that should be exposed to menu block from this class */
    static get actions(){
        return [
            {"remove from window": {
                func: HTMLElement.prototype.remove,
                info: "Calls this.remove()"
            }},
            {"become": {
                func: this.prototype.become,
                args: [{select: this.becomeable}],
                default: [ctx => ctx.tagName.split('-')[0].toLowerCase()],
                info: "Instantiates a new node of the selected type, copying all attributes from this node to the new one."
            }},
            {"inspect or modify": {
                func: this.prototype.inspectOrModify,
                args: [{select: ["style.css","class.js","template.html"]}, {select: this.becomeable}],
                default: [() => "style.css", ctx => ctx.tagName.split('-')[0].toLowerCase()]
            }},
            {"add sibling": {
                func: this.prototype.insertSibling,
                args: [{select: this.becomeable} ],
                default: [() => "become"]
            }}
            // nested options should be possible,
            // {"view":[fullscreen frame, fullscreen block, add frame, swap frame}
  
        ]
    }

    static get reactions(){
        // return array of objects {observe: Array, respond: Function}
        // when an attribute listed in an observe property is changed, function will be called on the new value
        // by the way these will be called via `.call(this, newValue)` so you can use `this`
        return [
            {
                observe: ["error"],
                respond: function(errMsg){
                    if(this.child['footer'] == undefined) return console.error(message)
                    let newMsg = document.createElement('error-message')
                    newMsg.textContent = errMsg
                    this.child['footer'].appendChild(newMsg)
                    /* hide error message after one second, allow css animations to occur */
                    setTimeout(()=>newMsg.classList.add('dismissed'), 5000)
                }
            },
            {
                observe: ["alert"],
                respond: function(alertMsg){
                    if(this.child['footer'] == undefined) return alert(alertMsg) // maybe alert if no footer?
                    let newMsg = document.createElement('success-message')
                    newMsg.textContent = alertMsg
                    this.child['footer'].appendChild(newMsg)
                    /* hide error message after one second, allow css animations to occur */
                    setTimeout(()=> newMsg.classList.add('dismissed'), 2500)
                }
            },
            {
                observe: ["src"],
                respond: function(){
                    this.readyState = 'interactive'
                }
            }
        ]
    }

    /* observedAttributes + attributeChangedCallback are native custom element callbacks, used here to build my reaction functionality
     *
     * 
     * */
    static get observedAttributes(){
        // return list of attribute names to watch for changes
        let arrayOfArraysOfObservables = this.inheritedReactions.map(reaction => reaction.observe)
        let arrayOfObservables = Array.prototype.concat(...arrayOfArraysOfObservables)
        // convert to and from a Set as a quick and dirty way to remove duplicate values
        // maybe not the most efficiet, not sure how converting array to set shakes out
        let setOfObservables = new Set(arrayOfObservables)
        return Array.from(setOfObservables)
    }
    
    static get inheritedReactions(){
        // iterate over properties of superclass chain, merge them into one object
        // each class may have a reactions getter that returns a 
        return Array.prototype.concat(...this.superClassChain.map(superclass => superclass.reactions))
    
    }
    
    attributeChangedCallback(attributeName, oldValue, newValue){
        // could be an array of reactions, of named tuples, so they could be concatenated
        // and on attribute change you just have to filter the array based on whether the key includes attribute name
        let reactionArray = this.constructor.inheritedReactions
        reactionArray.filter(reaction => {
            // test whether a reaction title includes the attribute name
            return reaction.observe.includes(attributeName)
        }).forEach(reaction => {
            // call each function in order, using present element as context, pass newValue
            reaction.respond.call(this, newValue)
        })
    }

    /* interface functions that should only exist in ProtoBlock, do not override! */
    
    /* get list of actions available on every class on the prototype chain and 
     * return an object to render MenuBlock */

    get inheritedActions(){
        var arrayOfArraysOfActions = this.superClassChain.map(superclass => superclass.actions)
        return Array.prototype.concat(...arrayOfArraysOfActions)
    }

    // whether you ask for the superClassChain on a class or class instance, you should get the same array back
    get superClassChain(){
        return this.constructor.superClassChain
    }

    static get superClassChain(){
        /* is there a javascript built in I don't know about? Chrome seems to resolve this automatically in inspector, can I just ask an object for its list of prototypes instead of iterating ? */
        var superClassChain = []
        var superclass = this /* this is the part thats different for the class method: we can call the prototype of the class */
        while(superclass.name != 'HTMLElement'){
            superClassChain.push(superclass)
            superclass = superclass.__proto__
        }
        // return array starting with class nearest HTMLElement (ProtoBlock) and go from there
        return superClassChain.reverse()
    }

    become(block = this.constructor){
        // shell-block is the tagName of a ShellBlock, two different ways to make the same thing,
        // depending on whether become was called with a reference to a class or just the string of a tagName
        var newBlock = typeof block == 'string' ? document.createElement(block.includes('-') ? block : block + '-block') // shell-block or shell both return shell-block
                                                : new block
<<<<<<< 65f8ad09e4ba0c012e3b6aace2326c063b888e07
        newBlock.props = this.props
        this.replaceWith(newBlock)
        // oof. cant set data until shadowroot is attached. I guess that makes sense?
        newBlock.data = this.data
=======
        
>>>>>>> moving to new actionio and figjam infrastructure
        // I'm expecting the element that has been replaced to be garbage collected
        this.replaceWith(newBlock)
        newBlock.addEventListener('ready', () => {
            newBlock.props = this.props
        })
        // could have been new block(this.props) if I had a way of invoking class constructor from string... 
        return newBlock
    }
    // {"div":{"id":"example", "textContent":"something like this"}} => <div id="example"> something like this </div>
    createElementFromObject(object){
        let tagName = Object.keys(object)[0]
        let attrObj = object[tagName]
        let node = document.createElement(tagName)
        for(var attr in attrObj){
            if(attr == 'textContent'){
                node.textContent = attrObj[attr]
            } else {
                node.setAttribute(attr, attrObj[attr])
            }
        }
        return node
    }

    attachGlobalScript(filename){
        return new Promise((resolve, reject) => {
            let existingScripts = Array.from(document.head.getElementsByTagName('script'))
            if(existingScripts.some(script => script.getAttribute('src') == filename)){
                // if the script already exists, resolve
                resolve()
            } else {
                // else resolve once the newly appended script is done loading
                let newScript = document.createElement('script')
                newScript.setAttribute('src', filename)
                newScript.addEventListener('load', () => {
                    resolve()
                })
                document.head.appendChild(newScript)
            }
        })
    }

    loadLocalStyle(filename){
        return new Promise((resolve, reject) => {
            let existingStyles = Array.from(this.shadowRoot.children)
            if(existingStyles.some(style => style.getAttribute('href') == filename)){
                resolve()
            } else {
                let newStyle = document.createElement('link')
                newStyle.setAttribute('rel', 'stylesheet')
                newStyle.setAttribute('href',filename)
                newStyle.addEventListener('load', () => {
                    resolve()
                })
                this.shadowRoot.insertBefore(newStyle, this.shadowRoot.firstElementChild)
            }
        })
    }

    // properties is soooo eassssy, to register a function to make something out of a property change
    // each class has a static get properties, which returns an object of property names and functions to call on change
    //  
    // shouldn't be overridden in descendents, unless you really want to ignore inherited attribute change callbacks

    inspectOrModify(filename){
        let filepath = `/aubi/gui-blocks/${this.tagName.toLowerCase().split('-')[0]}/${filename}`
        // check if CodemirrorBlock is available, then check if TextareaBlock is available, else just exit I guess
        // TextBlock.from(filepath)
        // eventually CodeMirrorBlock
        // set 'target' of codemirror as selector of a node
        // maybe use DirectoryBlocks function to open the appropriate block
        // open TextBlock from the source code, might be class.js
    }

    checksForServerError(response){
        /* append to any fetch to throw 500 messages to the catch block */
        return response.ok ? response : response.text().then(msg => {throw new Error(response.status == 302 ? 'Your cookie is no good anymore. Please refresh the page to log in.' : msg)})
    }

    set props(data){
        if(!data) return data // exit in the case of this.props = this.options, but options was undefined
        if(typeof data != 'object') throw new Error("Set props requires an object to update from")
        Object.keys(data).forEach(key => {
            // handle depth-1 nested objects, if a prop is an object, stringify it, I can parse it when I see it change like all the rest in attributeChangedCallback
            this.setAttribute(key, typeof data[key] == 'object' ? JSON.stringify(data[key]) : data[key])
        })
        return this.props
    }

    get props(){
        if(!this.attributes.length) return {}
        /* an ugly way to coerce a NamedNodeMap (attributes) into a normal key: value object. 
        Use ES6 enhanced object literals to eval node.name as a key, so you have an array of objects (instead of attribute) and then you can just roll it up with reduce */
        return Array.from(this.attributes, attr => ({[attr.name]: attr.value}))
                    .reduce((a, n) => Object.assign(a, n)) // You would think you could do .reduce(Object.assign), but assign is variadic, and reduce passes the original array as the 4th argument to its callback, so you would get the original numeric keys in your result if you passed all 4 arguments of reduce to Object.assign. So, explicitely pass just 2 arguments, accumulator and next.
    }

    insertSibling(node){
        if(typeof node == 'string'){
            // I don't want a string I want a node, make a node from the string
            node = document.createElement(node.includes('-') ? node : node + '-block') 
        }
        this.insertAdjacentElement('afterend', node)
        setTimeout(()=>node.focus())
    }

    whatChildIsThis(node){
        /* if node is child of component, return the array index, else -1 */
        return Array.from(this.shadowRoot.children).indexOf(node)
    }

    resolvePath(pathname){
        pathname = pathname.trim() // go ahead and get rid of excess whitespace
        /* just does transforms like 
            /../../docs/ => /docs/
            /docs/././downloads/ => /docs/downloads/
            /docs/../ => /
        It does so by splitting pathname into parts and iterating over the array
        for each part, I do a look ahead: 
            if next part is .., mark this one for deletion (unless its the first part, or this would destroy the leading slash)
            if this part is .., mark for deletion
            if this part is ., mark for deletion
            otherwise leave it alone
        So "mark" is just "push 'true' to bitmask" which will be used to filter it at the end
        */
        console.log("resolving", pathname)
        let pathParts = pathname.split('/')
        /* this tilde handling could be upgraded to handle paths relative to tilde
           but for now I just want the tilde to be a shortcut back to home */
        /* if pathname is undefined also return document home */
        if(pathname == '' || pathname == 'undefined' || pathParts.filter(Boolean).slice(-1) == '~'){
            return env.home + '/'
        }
        
        let bitmask = pathParts.map((part, index) => {
            return pathParts[index + 1] == '..' && index != 0
            || part == '..'
            || part == '.'
        })
        // bit mask will be like [false, true, true, false], the true values are the ones we want to filter out, so !invert the bitmask
        return pathParts.filter((e,i) => !bitmask[i]).join('/')
    }

    object2query(object){
        return '?' + Object.keys(object)
                           .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(object[key])}`)
                           .join('&')
    }

    // getters and setters for common interface

    get header(){
        let header = this.child['header-title'] || this.child['header']
        if(!header) console.error(`${this.tagName} has no header node, failed to get.`)
        return header.textContent
    }

    set header(newTextContent){
        let header = this.child['header-title'] || this.child['header']
        if(!header) console.error(`${this.tagName} has no header node, failed to set ${newTextContent}`)
        else return header.textContent = newTextContent
    }
    
    set data(newTextContent){
        if(!this.child['textarea']) throw new Error(`${this.tagName} has no textarea node to record data`)
        return this.child['textarea'].textContent = newTextContent
    }

    get data(){
        return this.child['textarea'] ? this.child['textarea'].value : ''
    }

    set errMsg(errorText){
        console.error("Error from", this.props.id || this.props.tagName, "\n", errorText)
        this.setAttribute('error', errorText)
    }

    // don't mind me
    set readyState(newValue){
        if(['loading','interactive','complete'].includes(newValue) == false) throw new Error("readyState must be load, interactive, or complete. I got " + newValue)
        console.log(this.tagName.toLowerCase(), "is now", newValue)
        this._readyState = newValue
        this.props.readyState = newValue // make css easy for blocks that are loading resources 
        this.dispatchEvent(new Event('readyStateChange'))
    }
    
    get readyState(){
        return this._readyState
    }

    get workingDirectory(){
        return this.getAttribute('cwd') || location.pathname
    }

    static get becomeable(){
        let possibleBlocks = []
        let protoGenome = window.genetics.filter(node => Object.keys(node)[0] == 'proto')[0].proto
        // recurse over genes and flatten them into list
        protoGenome.descendents.forEach(function buildBlockList(gene){
            let tagName = Object.keys(gene)[0]
            let attrObj = gene[tagName]
            if(attrObj === false || attrObj.active === false || attrObj.standalone === false) return null
            
            possibleBlocks.push(tagName)
            if(Array.isArray(attrObj.descendents)){
                attrObj.descendents.forEach(buildBlockList)
            }
        })
        return possibleBlocks
    }
    // 
    JSONorNOT(string){
        try {
            return JSON.parse(string)
        } catch(e) {
            return string
        }
    }
}