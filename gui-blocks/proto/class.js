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
        try {
            this.superClassChain.forEach(superclass => {
                if(superclass.hasOwnProperty('build')){
                    superclass.build.call(this)
                }
            })
        } catch(err) {
            console.error(err)
            // this.shadowRoot.innerHTML = <menu-block></menu-block><footer></footer>
        }
        // done loading initial HTML template, you can now call atributeChangedCallbacks and son on...
        this.dispatchEvent(new Event('DOMContentLoaded'))        
        // if there is a src, be 'interactive' and wait until whatever function is responsible for loading it fires 'load'
        // if, for instance, src is set on an img tag in shadowRoot, the load event will have to be retargeted to the host element
        // if there's no source, then we're done here.
        this.readyState = this.props.src ? 'interactive' : 'complete'
    }

    disconnectedCallback(){
        this.superClassChain.forEach(superclass => {
            superclass.destroy && superclass.destroy.call(this)
        })
        // document.body.childElementCount || document.body.appendChild(new BecomeBlock)
        // what happens if you delete the last node on the screen?
        // maybe you have a document background and that's okay to look at until you refresh... no functionality unless someone puts it there tho...
        // maybe check the document root, if there's nothing there... become become? 
        // event listener for double click to create menu?
        // hmm... maybe the background can always make a menu block fixed at the location of click...
        // maybe set up that right click expectation...  message (hold ctrl to use regular right click)
        // or long press
    }


    // called in order from proto -> descendant. When connected to the DOM, all the init functions are called, then all the ready functions are called
    static build(){
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
        this.shadowParent = this.getRootNode().host
        // allow instant reference to any uniquely named child (descriptive custom tags are encouraged) as this.child[tagname]
        // basically as a shortcut as this.shadowRoot.querySelector('tagname') for brevity and reducing lookups
        this.child = Array.from(this.shadowRoot.querySelectorAll('*'), child => {
            /* enhanced object literal dynamically names object keys */            
            return {[child.tagName.toLowerCase()]: child}
            /* from an array of objects, reduce to one object of all keys */
        }).reduce((a,b) => Object.assign(a,b),{})
        // set a reference to this elements parent, if there's a shadowRoot between here and there
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
                args: [{select: window.guinames}],
                default: [ctx => ctx.tagName.split('-')[0].toLowerCase()],
                info: "Instantiates a new node of the selected type, copying all attributes from this node to the new one."
            }},
            {"inspect or modify": {
                filter: false,                
                func: this.prototype.inspectOrModify,
                args: [{select: ["style.css","class.js","template.html"]}, {select: window.guinames}],
                default: [() => "style.css", ctx => ctx.tagName.split('-')[0].toLowerCase()]
            }},
            {"add sibling": {
                func: this.prototype.insertSibling,
                args: [{select: window.guinames} ],
                default: [() => "become"]
            }}
            // nested options should be possible,
            // {"view":[fullscreen frame, fullscreen block, add frame, swap frame}
  
        ]
    }

    static get reactions(){
        // return array of objects {observe: Array, react: Function}
        // when an attribute listed in an observe property is changed, function will be called on the new value
        // by the way these will be called via `.call(this, newValue)` so you can use `this`
        return [
            {
                watch: ["error"],
                react: function(attributeName, oldValue, newValue){
                    if(this.child['footer'] == undefined) return console.error(newValue)
                    let newMsg = mixint.createElement({
                        "error-message": {
                            textContent: newValue
                        }
                    })
                    this.child['footer'].appendChild(newMsg)
                    /* hide error message after one second, allow css animations to occur */
                    setTimeout(()=>newMsg.classList.add('dismissed'), 5000)
                }
            },
            {
                watch: ["finish"],
                react: function(attributeName, oldValue, newValue){
                    if(this.child['footer'] == undefined) return console.log(newValue) // maybe alert if no footer?
                    let newMsg = mixint.createElement({
                        "success-message": {
                            textContent: newValue
                        }
                    })
                    this.child['footer'].appendChild(newMsg)
                    /* hide error message after one second, allow css animations to occur */
                    setTimeout(()=> newMsg.classList.add('dismissed'), 2500)
                }
            },
            {
                watch: ["src"],
                react: function(){
                    this.readyState = 'interactive'
                }
            },
        ]
    }

    /* observedAttributes + attributeChangedCallback are native custom element callbacks, used here to build my reaction functionality
     *
     * 
     * */
    static get observedAttributes(){
        // return list of attribute names to watch for changes
        let arrayOfArraysOfObservables = this.inheritedReactions.map(reaction => reaction.watch)
        let arrayOfObservables = Array.prototype.concat(...arrayOfArraysOfObservables)
        // convert to and from a Set as a quick and dirty way to remove duplicate values
        // maybe not the most efficiet, not sure how converting array to set shakes out
        // should be linear tho... iterate to add each element to set, then iterate once more to return the array
        let setOfObservables = new Set(arrayOfObservables)
        return Array.from(setOfObservables)
    }
    
    static get inheritedReactions(){
        // iterate over properties of superclass chain, merge them into one object
        // each class may have a reactions getter that returns a 
        return Array.prototype.concat(...this.superClassChain.map(superclass => superclass.reactions))
    
    }
    
    attributeChangedCallback(attributeName, oldValue, newValue){
        /* TWO STEP: 1. if there's a data tag, update its textContent. 2. if there's a watch function, call it. */
        // later. not consistant with how I want bashio's stdout/stderr/error to happen (append, not replace, and call makeHTML)
        // if(this.child['data-' + attributeName]){
        //     this.child['data-' + attributeName].textContent = newValue
        // }
        
        // could be an array of reactions, of named tuples, so they could be concatenated
        // and on attribute change you just have to filter the array based on whether the key includes attribute name
        let reactionArray = this.constructor.inheritedReactions
        let goingToBecome = this.props.become
        reactionArray.filter(function(reaction){
            if(attributeName == 'become'){
                // well, react to become of course
                return reaction.watch.includes(attributeName)
            } else if(goingToBecome){
                // don't react to anything else if become is truthy on this node, we want to wait until after we've become
                return false
            } else {
                // and then we're just filtering functions to ones that are meant to react to the current attribute
                return reaction.watch.includes(attributeName)
            }
            // test whether a reaction title includes the attribute name
            // don't do anything if become is truthy, they should happen after become has happened and everything will be called over again
        }).forEach(reaction => {
            // call each function in order, using present element as context, pass newValue
            if(this.readyState == 'interactive' || this.readyState == 'complete'){
                // console.log("calling!", reaction.react.toString())
                reaction.react.call(this, attributeName, oldValue, newValue)
            } else {
                this.addEventListener('DOMContentLoaded', function(event){
                    event.stopPropagation() // should only fire listeners on this exact node, not its parents
                    reaction.react.call(this, attributeName, oldValue, newValue)
                }, {once: true})
            }
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
        // throw new Error('ready to become')
        // I'm expecting the element that has been replaced to be garbage collected
        // overwrite become property at assign time, don't modify become property of this
        let newProps = this.props
        // copy all 'ownProperty' of DIV. this will include 'this.shell' if this is a bashio thing, any other properties that might want to be set
        // may cause unexpected behavior if you're expecting a fresh slate after become. I'm deleting become and readyState, but, watch out for internal properties you don't expect to stick around
        // really cool thing about this is it effectively retargets all my event listeners that were attached to an EventSource
        // since all the callbacks modify 'this', since I'm copying over... need to dig into the value property of each PropertyDescriptors... maybe this could be a for..in(readuce) situation... but this makes sense to me.
        // and that shell object is copied by reference, doesn't clone it or anything... And there can be only one context, so I'm 99% sure I don't have to worry about duplicate callbacks once moving shell to a new block.
        Object.assign(newBlock, ...Object.getOwnPropertyNames(this).map(each => {
            return {[each]: Object.getOwnPropertyDescriptors(this)[each].value}
        }))
        delete newProps.become
        delete newProps.readystate // remove attribute from HTML
        delete newBlock._readyState // remove internal property

        newBlock.props = newProps
        this.replaceWith(newBlock) // hopefully replace with will fire 
        // could have been new block(this.props) if I had a way of invoking class constructor from string... 
        return newBlock
    }
    // {"div":{"id":"example", "textContent":"something like this"}} => <div id="example"> something like this </div>
    // createElementFromObject(object){
    //     let [ tagName, attrObj ] = Object.entries(object)[0]

    //     let node = document.createElement(tagName)
    //     for(var attribute in attrObj){
    //         let newValue = attrObj[attribute]
    //         switch(attribute){
    //             case 'textContent':
    //                 node.textContent = newValue
    //                 break            
    //             case 'addEventListener':
    //                 for(var eventName in newValue){
    //                     // could check if newValue[eventName] is an array of functions to add... 
    //                     node.addEventListener(eventName, newValue[eventName])
    //                 }
    //                 break
    //             case 'style': 
    //                 if(newValue && newValue.constructor == String) node.style = newValue
    //                 if(newValue && newValue.constructor == Object) Object.assign(node.style, newValue)
    //                 break
    //             case 'childNodes':
    //                 Array.isArray(newValue) && newValue.filter(Boolean).forEach(child => {
    //                     node.appendChild(child instanceof Element ? child : mixint.createElement(child))
    //                 })
    //                 break
    //             case 'value':
    //                 // special case for form nodes where setting the value 'attribute' should set the value of the form
    //                 node.value = newValue
    //                 // break dont break, no harm in setting value property and value attribute
    //                 // select options want value attributes I guess?
    //             default: 
    //                 node.setAttribute(attribute, newValue)
    //         }
    //     }
    //     return node
    // }

    attachGlobalScript(filename){
        // this appear to resolve somehat prematurely... but its on load so ????
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
        // i think it'll be cool to do a live edit on the style tag internal to the current node, but then save to the template
        // at that point if you reinitialize anything that uses it, it'll update from new template
        let filepath = `gui-blocks/${this.tagName.toLowerCase().split('-')[0]}/${filename}`
        // TextBlock.from(filepath)
        // eventually CodeMirrorBlock
        // set 'target' of codemirror as selector of a node
        // maybe use DirectoryBlocks function to open the appropriate block
        // open TextBlock from the source code, might be class.js
    }

    // set props(data){
    //     if(!data) return data // exit in the case of this.props = this.options, but options was undefined
    //     if(typeof data != 'object') throw new Error("Set props requires an object to update from")
    //     Object.keys(data).forEach(key => {
    //         // handle depth-1 nested objects, if a prop is an object, stringify it, I can parse it when I see it change like all the rest in attributeChangedCallback
    //         this.setAttribute(key, typeof data[key] == 'object' ? JSON.stringify(data[key]) : data[key])
    //     })
    //     return this.props
    // }

    // get props(){
    //     /* an ugly way to coerce a NamedNodeMap (attributes) into a normal key: value object. 
    //     Use ES6 enhanced object literals to eval node.name as a key, so you have an array of objects (instead of attribute) and then you can just roll it up with reduce */
    //     let props = Array.from(this.attributes, attr => ({[attr.name]: attr.value}))
    //                      .reduce((a, n) => Object.assign(a, n)) // You would think you could do .reduce(Object.assign), but assign is variadic, and reduce passes the original array as the 4th argument to its callback, so you would get the original numeric keys in your result if you passed all 4 arguments of reduce to Object.assign. So, explicitely pass just 2 arguments, accumulator and next.
    //     return new Proxy(props, {
    //         set: (obj, prop, value) => {
    //             value ? this.setAttribute(prop, value) : this.removeAttribute(prop)
    //             return true
    //         },
    //         get: (target, name) => {
    //             return this.getAttribute(name.toLowerCase())
    //         }
    //     })
    // }

    insertSibling(node){
        if(typeof node == 'string'){
            // I don't want a string I want a node, make a node from the string
            node = document.createElement(node.includes('-') ? node : node + '-block') 
        }
        this.insertAdjacentElement('afterend', node)
        setTimeout(()=>node.focus())
    }

    resolvePath(pathname){
        if(!pathname) return ''
        let pathParts = pathname.trim().split('/')
        // drop any path parts before a tilde, they're irrelevant, and prepend as HOME variable at the front of the array
        if(pathParts.includes('~')){
            while(pathParts.includes('~')) pathParts.shift()
            pathParts.unshift(window.env.HOME)
        }
        // flag collapsible pathParts for deletion
        let bitmask = pathParts.map((part, index) => {
            // any parts followed by '..', any '..', and any '.' can be dropped from the path, this is a little logic expression to that
            return (pathParts[index + 1] == '..' & index != 0 | part == '..' | part == '.')
        })
        // the true values are the ones we want to filter out, so !invert the bitmask
        return pathParts.filter((e,i) => !bitmask[i]).join('/')
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

    // don't mind me
    set readyState(newValue){
        if(['loading','interactive','complete', undefined].includes(newValue) == false) throw new Error("readyState must be load, interactive, or complete. I got " + newValue)
        console.log(this.tagName.toLowerCase(), "is now", newValue)
        this._readyState = newValue
        this.setAttribute('readystate', newValue) // make css easy for blocks that are loading resources 
        this.dispatchEvent(new Event('readyStateChange'))
        if(newValue == 'complete'){
            this.dispatchEvent(new Event('load'))
        }
    }

    /* override these HTMLElement functions with ones that query the shadow children instead of the lit children */ 
    querySelector(selector){
        return this.shadowRoot.querySelector(selector)
    }
    querySelectorAll(selector){
        return this.shadowRoot.querySelectorAll(selector)
    }

    get readyState(){
        return this._readyState
    }

    get workingDirectory(){
        return this.getAttribute('cwd') || location.pathname
    }

    // 
    JSONorNOT(string){
        try {
            return JSON.parse(string)
        } catch(e) {
            return string
        }
    }

    errorMsg(errorStringOrObject){

    }

    alertMsg(alertStringOrObject, heading = 'Good News', color = '#00da00'){

    }
}

/*
    ProtoBlock.prototype.errorMsg = function errorMsg(errorString){
        mixint.createElement({'alert-msg':{
            style: { color },
            textContent: alertString,
            childNodes: [{

            }]
        }})
    }
*/