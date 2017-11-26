class MultiplexBlock extends ProtoBlock {
    constructor(props){
        super(props)

        if(this.constructor.name == "MultiplexBlock"){
            throw new Error("MultiplexBlock is a prototype for vsplit, hsplit, fibonacciplexer and others, but it cannot exist on its own; it prescribes no method for calculating the size of its children")
        }
        this.addEventListener('init', () => {
            /* hoist child nodes of custom element INTO the shadowRoot of this */
            // my version of slotting. Should I be using slots for this? 
            Array.from(this.children, child => this.shadowRoot.appendChild(child))
            // if the only childElement is the style, append a couple of become-blocks
            if(this.shadowRoot.childElementCount == 1){
                this.shadowRoot.appendChild(new BecomeBlock)
                this.shadowRoot.appendChild(new BecomeBlock)
            }

            /* some default attributes */
            this.showStart || (this.showStart = 1) //0th is style tag
            this.showMax || (this.showMax = 2) // attribute change will fire reCalculateChildren()
            // new MutationObserver(...).observe(this.shadowRoot.children)
            // watch child nodes for new nodes, deleted nodes, and replaced nodes
            new MutationObserver(events => {
                events.forEach(event => {
                    event.addedNodes.forEach(newChild => {
                        if(!Array.from(this.shadowRoot.children).includes(newChild)){
                            // mutation from further down the tree, no action required
                            return null
                        }
                        console.log("INIT", newChild.props)
                        let lastVisibleIndex = this.showStart + this.showMax - 1 // -1 to get to Array Index n                
                        // let enclosedNewChild = newChild
                        let nthIndex = this.whatChildIsThis(newChild)
                        this.deflate(newChild)                    
                        if(nthIndex > lastVisibleIndex){
                            this.showStart += 1 // will synchronously trigger a recalc, setting style left to destination postion      
                        } else {
                            this.reCalculateChildren()                                                    
                        }
                        this.inflate(newChild)
                    })
    
    
                    event.removedNodes.forEach(oldChild => {
                        let nth = oldChild.getAttribute('tabindex')
                        let lastVisibleIndex = this.showStart + this.showMax
                        if(this.shadowRoot.children.length < lastVisibleIndex){
                            this.showStart -= 1
                            lastVisibleIndex--
                        }
                        this.reCalculateChildren()   
                        // focus whatever child has the new tabindex equal to the old one
                        this.shadowRoot.querySelector(`[tabindex="${nth}"]`).focus()                                            
                    })
    
                    // if 'become' was called, a node will be destroyed with a fresh one in its place
                    // addedNodes will equal removedNodes, and I'll need to give the new node new dimensions
                    if(event.addedNodes.length == event.removedNodes.length){
                        this.reCalculateChildren()                                
                    }
                })
            }).observe(this.shadowRoot, {childList: true})

            this.addEventListener('keydown', event => {
                /* modify max and start with ctrl+shift+[wasd] */
                if(!(event.ctrlKey & event.shiftKey)) return null
                event.stopPropagation()
                switch(event.key){
                    case 'ArrowUp': this.showMax++; break;
                    case 'ArrowLeft': this.showStart > 1 && this.showStart--; break;
                    case 'ArrowDown': this.showMax > 2 && this.showMax--; break;
                    case 'ArrowRight': this.showStart < this.shadowRoot.children.length - this.showMax && this.showStart++; break;
                }
            })
        })
    }

    static get observedAttributes(){
        return ['show-start','show-max']
    }

    attributeChangedCallback(){
        console.log("attribute recalc")
        this.reCalculateChildren()
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))
                         && this.dispatchEvent(new Event('ready'))
    }

    // reCalculateChildren defined by subclasses, vsplit, hsplit, fibonacciplex
        

    set showStart(newStartIndex){
        this.setAttribute('show-start', newStartIndex)
    }
    get showStart(){
        return parseInt(this.getAttribute('show-start'))
    }
    set showMax(newShowMax){
        this.setAttribute('show-max', newShowMax)
    }
    get showMax(){
        return parseInt(this.getAttribute('show-max'))
    }
}