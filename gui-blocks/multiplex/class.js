class MultiplexBlock extends ProtoBlock {
    constructor(){
        super()
    }

    connectedCallback(initializing){
        console.log("MULTIPLEX INIT", initializing)
        if(initializing || this.hasntBeenInitializedYet()){
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
            this.selfAwareness = new MutationObserver(event => {
                console.log(event)
                let childrenDelta = event[0].addedNodes.length - event[0].removedNodes.length
                this.showStart = childrenDelta + parseInt(this.props["show-start"])
                this.reCalculateChildren()
            })
            this.selfAwareness.observe(this.shadowRoot, {childList: true, attributes: true})
            this.props = {tabindex: 0}
            this.addEventListener('keydown', event => {
                /* modify max and start with ctrl+shift+[wasd] */
                if(!(event.ctrlKey & event.shiftKey)) return null

                switch(event.key){
                    case 'w': this.showMax++; break;
                    case 'a': this.showStart--; break;
                    case 's': this.showMax--; break;
                    case 'd': this.showStart++; break;
                }
            })
        }   
    }

    // reCalculateChildren defined by subclasses, vsplit, hsplit, fibonacciplex
        

    set showStart(newStartIndex){
        this.setAttribute('show-start', newStartIndex)
    }
    get showStart(){
        return this.getAttribute('show-start')
    }
    set showMax(newShowMax){
        this.setAttribute('show-max', newShowMax)
    }
    get showMax(){
        return this.getAttribute('show-max')
    }
}