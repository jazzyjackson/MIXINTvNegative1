class HsplitBlock extends MultiplexBlock {
    constructor(){
        super()
        this.addEventListener('init', () => {
        })
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))        
    }

    animateNewChild(node){
        if(!node) return null /* exit it child doesn't exist */
        /* force a margin animation on new children */
        node.style.marginLeft = `${100 / this.showMax}%`
        setTimeout(()=>{
            /* have to take a step out of sync for a second, let the margin */
            /* get painted, but throw a transition to 0 on the event loop */
            node.style.marginLeft = '0%'
        })
    }

    reCalculateChildren(){
        let width = 100 / parseInt(this.getAttribute('show-max'))
        let start = parseInt(this.getAttribute('show-start'))
        Array.from(this.shadowRoot.children, (child, nth) => {
            child.style.width = `${width}%`
            child.style.left = `${width * (nth - start)}%`
        })
    }
}