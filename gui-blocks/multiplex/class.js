class MultiplexBlock extends ProtoBlock {
    constructor(){
        super()
        if(this.constructor.name == "MultiplexBlock"){
            throw new Error("MultiplexBlock is a prerequisite to vsplit, hsplit, fibonacciplexer and others, but it cannot exist on its own, it prescribes no method for calculating the size of its children")
        }
        this.addEventListener('init', () => {
            /* hoist child nodes of custom element INTO the shadowRoot of this */
            Array.from(this.children, child => this.shadowRoot.appendChild(child))
            /* some default attributes */
            this.showStart || (this.showStart = 1) //0th is style tag
            this.showMax || (this.showMax = 2)

            /* but this is a split, so if I wasn't initialized with children, lets make some new ones */
            while(this.shadowRoot.children.length <= this.showMax){
                this.shadowRoot.appendChild(new BecomeBlock)
            }

            this.reCalculateChildren()                        
            this.watchChildren = new MutationObserver(event => {
                let childrenDelta = event[0].addedNodes.length - event[0].removedNodes.length

                /* if there's a new child, animate its creation */
                let newChild = event[0].addedNodes[0]
                let nthIndex = this.whatChildIsThis(newChild)
                let lastVisibleIndex = this.showStart + this.showMax - 1 // -1 to get to Array Index n
                console.log({nthIndex, lastVisibleIndex, newChild, childrenDelta})
                if(nthIndex > lastVisibleIndex || childrenDelta < 0){
                    this.showStart = childrenDelta + parseInt(this.props["show-start"])                                                                
                }
                childrenDelta && this.animateNewChild(newChild)                
                this.reCalculateChildren()

            })
            this.watchChildren.observe(this.shadowRoot, {childList: true, attributes: true})
            this.props = {tabindex: 0}
            this.addEventListener('keydown', event => {
                console.log(event)
                /* modify max and start with ctrl+shift+[wasd] */
                if(!(event.ctrlKey & event.shiftKey)) return null
                event.stopPropagation()
                switch(event.key){
                    case 'ArrowUp': this.showMax++; break;
                    case 'ArrowLeft': this.showStart > 1 && this.showStart--; break;
                    case 'ArrowDown': this.showMax > 2 && this.showMax--; break;
                    case 'ArrowRight': this.showStart < this.shadowRoot.children.length - 1 && this.showStart++; break;
                }
            })
        })
    }

    static get observedAttributes(){
        return ['show-start','show-max']
    }

    attributeChangedCallback(){
        this.reCalculateChildren()
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))                
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