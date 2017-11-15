/* ProtoBlock has no style or template, 
it's only meant to hold the utility methods that all blocks are expected to inherit. 
There is no custom element. no document.createElement('proto-block'), just, class extends ProtoBlock */

class ProtoBlock extends HTMLElement {
    constructor(props){
        super()
        this.addEventListener('init', () => {
            this.props = props // props is set twice - once because attributes may need to exist for menu            
            console.log("proto called from",this.tagName)
            this.initialized = true
            var template = document.querySelector(`template[renders="${this.tagName.toLowerCase()}"]`)
            if(!template) return console.error(`${this.tagName} has no template`)

            this.attachShadow({mode: 'open'})
            this.shadowRoot.appendChild(template.content.cloneNode(true))
            this.shadowParent = this.getRootNode().host 
            /* if these don't exist it's no big deal,
            but it's a good standard that a headerTitle and a textarea exist */
            this.header = this.shadowRoot.querySelector('header-title') || this.shadowRoot.querySelector('header')
            this.textarea = this.shadowRoot.querySelector('textarea')    
            // just because they need to exist to pass name and textcontent in        
            if(this.header && !this.header.textContent){
                this.header.textContent = this.props.header || this.props.src || 'untitled'
            } 
            // if there's a become attribute, play along
            console.log("proto finished ",this.tagName)
            this.props = props // and again so that attributeChangedCallback is fired on ancestors                      
            
        })
    }

    /* get actions that should be exposed to menu block from this class */
    static get actions(){
        return [
            {"become": {
                func: this.prototype.become,
                args: [{select: window.defaultFig.blocks}],
                default: [ctx => ctx.tagName.split('-')[0].toLowerCase()],
                info: "Instantiates a new node of the selected type, copying all attributes from this node to the new one."
            }},
            {"remove from window": {
                func: HTMLElement.prototype.remove,
                info: "Calls this.remove()"
            }},
            {"inspect or modify": {
                func: this.prototype.inspectOrModify,
                args: [{"select": ["style.css","class.js","template.html"]}]
            }},
            // {"view":[
            //     {"fullscreen frame": {
    
            //     }},
            //     {"fullscreen block": {
                    
            //     }},
            //     {"add frame": {
    
            //     }},
            //     {"swap frame": {
    
            //     }}
            // ]}
            /* new child, new sibling -> templates */
        ]
  }

    /* get list of actions available on every class on the prototype chain and return an object to render MenuBlock */
    get actionMenu(){
        /* this goes from called block to protiest-prototype, 
           creating an array of actions 
           Since it's an array of objects only distinguishbale by their names,
           this was the flattest way I could think to create an array of unique objects
           otherwise there's lots of nested iterating and asking if an array contains an object that has the same key as this other object
           super inefficient, and maybe it was a mistake to make actionArrays arrays of objects instead of just an object that I coulde reduce(Object.assign) to a single object
           but distinguishing between an Array of actions and an object lets me have recursive menus, so I'm going to go with this for now
        */
        let actionArray = []
        let nameOf = object => Object.keys(object)[0]
        var actionNames = new Set()
        
        this.superClassChain.forEach(superClass => {
            var actions = superClass.actions
            actions.forEach(action => {
                if(!actionNames.has(nameOf(action))){
                    actionArray.push(action)
                    actionNames.add(nameOf(action))
                }
            })
        })             
        
        return actionArray
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

    get ephemeralAttributes(){
        /* attributes that shouldn't be copied when a block becomes another block (you can call .become() to reset a block by replacing it with a fresh instance, sans these attributes) */
        return ['style','become']
    }

    become(block = this.constructor){
        // shell-block is the tagName of a ShellBlock, two different ways to make the same thing,
        // depending on whether become was called with a reference to a class or just the string of a tagName
        var newBlock = typeof block == 'string' ? document.createElement(block.includes('-') ? block : block + '-block') // shell-block or shell both return shell-block
                                                : new block
        newBlock.props = this.props
        this.replaceWith(newBlock)
        // I'm expecting the element that has been replaced to be garbage collected
        return newBlock
    }

    attachGlobalScript(filename){
        return new Promise(function(resolve, reject){
            let existingScripts = Array.from(document.head.getElementsByTagName('script'))
            if(existingScripts.some(script => filename == script.getAttribute('src'))){
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

    inspectOrModify(filename){
        let filepath = `/gui-blocks/${this.tagName.toLowerCase().split('-')[0]}/${filename}`
        // TextBlock.from(filepath)
        // eventually CodeMirrorBlock
        // maybe use DirectoryBlocks function to open the appropriate block
        // open TextBlock from the source code, might be class.js
    }

    set props(data){
        if(!data) return data // exit in the case of this.props = this.options, but options was undefined
        if(typeof data != 'object') throw new Error("Set props requires an object to update from")
        Object.keys(data).forEach(key => {
            this.setAttribute(key, data[key])
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

    resolvePath(pathname){
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
        let pathParts = pathname.split('/')
        let bitmask = pathParts.map((part, index) => {
            return pathParts[index + 1] == '..' && index != 0
            || part == '..'
            || part == '.'
        })
        // bit mark will be like [undefined, true, true, undefined], the true values are the ones we want to filter out, so !invert the bitmask
        return pathParts.filter((e,i) => !bitmask[i]).join('/')
    }
}