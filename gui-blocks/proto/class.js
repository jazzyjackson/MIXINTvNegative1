/* ProtoBlock has no style or template, 
it's only meant to hold the utility methods that all blocks are expected to inherit. 
There is no custom element. no document.createElement('proto-block'), just, class extends ProtoBlock */

class ProtoBlock extends HTMLElement {
    constructor(){
        super()
    }
  /* get actions that should be exposed to menu block from this class */
    static get actions(){
        return {
            "become": {
                func: this.prototype.become,
                args: [{select: Array.from(document.querySelectorAll('template'), template => template.getAttribute('renders'))}],
                default: [ctx => ctx.tagName.toLowerCase()],
                info: "Instantiates a new node of the selected type, copying all attributes from this node to the new one."
            }, 
            "remove from window": {
                func: HTMLElement.prototype.remove,
                info: "Calls this.remove()"
            },
            "inspect or modify": {
                func: this.prototype.inspectOrModify,
                args: [{"select": ["style.css","class.js","template.html"]}]
            }
            /* new child, new sibling -> templates */
        }   
  }

  /* get list of actions available on every class on the prototype chain and return an object to render MenuBlock */
    get actionMenu(){
        /* this getter walks up the prototype chain, invoking 'get actions' on each class, then with that array of menu objects, reduce Object assign is called to return an amalgamated object of menu options */
        return this.superClassChain.map(superclass => superclass.actions)
                                    .reduce((a,b) => Object.assign(a,b))
                                    
    }

    static get requiredAttributes(){

    }

    static get superClassChain(){
        /* is there a javascript built in I don't know about? Chrome seems to resolve this automatically in inspector, can I just ask an object for its list of prototypes instead of iterating ? */
        var superClassChain = []
        var superclass = this /* this is the part thats different for the class method: we can call the prototype of the class */
        while(superclass.name != 'HTMLElement'){
            superClassChain.push(superclass.prototype.constructor)
            superclass = superclass.__proto__
        }
        return superClassChain 
    }

    get superClassChain(){
        var superClassChain = []
        var superclass = this.constructor /* this is the part thats different for the instance method: we have to call the constructor before we call for the prototype */
        while(superclass.name != 'HTMLElement'){
            superClassChain.push(superclass.prototype.constructor)
            superclass = superclass.__proto__
        }        
        return superClassChain
    }

    hasntBeenInitializedYet(){
        if(this.initialized) return false // in other words, that HAS been initialized already

        this.attachShadow({mode: 'open'})
        this.shadowRoot.appendChild(document.querySelector(`[renders="${this.tagName.toLowerCase()}"]`).content.cloneNode(true))  
        this.id = 'block' + String(Math.random()).slice(-4) + String(Date.now()).slice(-4) //random id for convenience. random number + time to reduce likelihood of collisions

        this.superClassChain.reverse().forEach(superClass => {
        /* this calls every connectedCallback up the class inheritence chain or whatever you want to call it */
        /* call in reverse order to invoke base class connectedCallback first. */
        /* doesn't call the connectedCallback of 'THIS' block, just all classes above it */
            superClass.prototype.connectedCallback != undefined
            && superClass.prototype.connectedCallback != this.connectedCallback 
            && superClass.prototype.connectedCallback.call(this)
        })
        /* I'm expecting connectedCallbacks to be effectively blocking so that init is fired once all methods and HTML nodes are on the DOM, that's my intention anyway */
            
        console.log(`A ${this.tagName.toLowerCase()} was initialized`)
        return this.initialized = true         
    }

    /* to be more extensible this should probably go up the superclasschain accumulating static get keepAttributes, and using that array to skip attribute removal */
    clear(){
        /* a method for destroying attributes, to reset the block, but there's probably some attributes you want to keep. tabIndex and style needs to exist for click and drag (active element works off focus, updates from style attributes) */
        let keepAttributes = ['id','style','tabindex','input','headless']
        return Array.from(this.attributes, attr => keepAttributes.includes(attr.name) || this.removeAttribute(attr.name))
    }

    become(block = this.constructor){
        // shell-block is the tagName of a ShellBlock, two different ways to make the same thing,
        // depending on whether become was called with a reference to a class or just the string of a tagName
        var newBlock = typeof block == 'string' ? document.createElement(block) : new block
        newBlock.props = this.props
        this.replaceWith(newBlock)
        // I'm expecting the element that has been replaced to be garbage collected
        return newBlock
    }

    inspectOrModify(filename){
        let filepath = `/gui-blocks/${this.tagName.toLowerCase().split('-')[0]}/${filename}`
        // TextBlock.from(filepath)
        // eventually CodeMirrorBlock
        // open TextBlock from the source code, might be class.js
    }

    set props(data){
        if(!data) return data // exit in the case of this.props = this.options, but options was undefined
        if(typeof data != 'object') throw new Error("Set props requires an object to update from")
        
        Object.keys(data).forEach(key => {
            let newData = data[key]
            let oldData = this.getAttribute(key)
            /* check if attribute is truthy, append data to existing attributes, create attribute otherwise */
            this.setAttribute(key, oldData ? oldData + newData : newData)
        })
        return this.props
    }

    get props(){
        /* an ugly way to coerce a NamedNodeMap (attributes) into a normal key: value object. 
        Use ES6 enhanced object literals to eval node.name as a key, so you have an array of objects (instead of attribute) and then you can just roll it up with reduce */
        return Array.from(this.attributes, attr => ({[attr.name]: attr.value}))
                    .reduce((a, n) => Object.assign(a, n)) // You would think you could do .reduce(Object.assign), but assign is variadic, and reduce passes the original array as the 4th argument to its callback, so you would get the original numeric keys in your result if you passed all 4 arguments of reduce to Object.assign. So, explicitely pass just 2 arguments, accumulator and next.
    }

    waitForDOM(){
        return new Promise(resolve => {
            if(document.readyState == 'complete') resolve()
            else window.addEventListener('load', resolve)
        })
    }
}