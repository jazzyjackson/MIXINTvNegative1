/* ProtoBlock has no style or template, 
it's only meant to hold the utility methods that all blocks are expected to inherit. 
There is no custom element. no document.createElement('proto-block'), just, class extends ProtoBlock */

class ProtoBlock extends HTMLElement {
    constructor(){
        super()
        this.addEventListener('init', () => {
            this.initialized = true
            var template = document.querySelector(`template[renders="${this.tagName.toLowerCase()}"]`)
            if(!template) return console.error(`${this.tagName} has no template`)

            this.attachShadow({mode: 'open'})
            this.shadowRoot.appendChild(template.content.cloneNode(true))
            this.shadowParent = this.getRootNode().host // might want this.getRootNode().host if this block would be nested somehow, but I'm not expected that to happen.
        })
    }

    /* get actions that should be exposed to menu block from this class */
    static get actions(){
        return {
            "become": {
                func: this.prototype.become,
                args: [{select: window.defaultFig.blocks}],
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
            },
            "view":[
                {"fullscreen frame": {
    
                }},
                {"fullscreen block": {
                    
                }},
                {"add frame": {
    
                }},
                {"swap frame": {
    
                }}
            ]
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
        if(!this.attributes.length) return {}
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

    insertSibling(node){
        if(this.nextElementSibling){
            this.parentNode.insertBefore(node, this.nextElementSibling)
        } else {
            this.parentNode.appendChild(node)
        }
    }

    whatChildIsThis(node){
        /* if node is child of component, return the array index, else -1 */
        return Array.from(this.shadowRoot.children).indexOf(node)
    }
}