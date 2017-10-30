class HsplitBlock extends MultiplexBlock {
    constructor(){
        super()
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))                
    }

    animateNewChild(node){
        if(!node) return null /* exit it child doesn't exist */
        /* force a margin animation on new children */
        node.style.height = 0
        node.style.opacity = 0
        setTimeout(()=>{
            node.style.opacity = 1
            node.style.opacity = null
            /* have to take a step out of sync for a second, let the margin */
            /* get painted, but throw a transition to 0 on the event loop */
            // node.style.marginLeft = '0%'
            // node.style.marginLeft = null
            this.reCalculateChildren()
        })
    }

    reCalculateChildren(){
        let height = 100 / this.showMax
        let start = this.showStart
        Array.from(this.shadowRoot.children, (child, nth) => {
            child.style.height = `${height}%`
            child.style.top = `${height * (nth - start)}%`
        })
    }
}