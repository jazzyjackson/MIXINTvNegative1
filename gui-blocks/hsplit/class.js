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
        node.style.marginTop = `${100 / this.showMax}%`
        setTimeout(()=>{
            /* have to take a step out of sync for a second, let the margin */
            /* get painted, but throw a transition to 0 on the event loop */
            node.style.marginTop = '0%'
            node.style.marginTop = null
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