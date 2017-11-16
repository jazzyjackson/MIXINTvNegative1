class HsplitBlock extends MultiplexBlock {
    constructor(props){
        super(props)
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))
                         && this.dispatchEvent(new Event('ready'))
    }

    deflate(node){
        node.setAttribute('deflate', true)
    }

    inflate(node){ 
        setTimeout(()=>{
            node.removeAttribute('deflate')
        })
    }

    
    reCalculateChildren(){
        switch(this.shadowRoot.childElementCount - 1){
            case 0: this.shadowRoot.appendChild(new BecomeBlock); break;
            case 1: this.shadowRoot.children[1].style.height = '100%'; this.shadowRoot.children[1].style.top = '0px'; break;
            default: 
                let height = 100 / this.showMax
                let start = this.showStart
                Array.from(this.shadowRoot.children, (child, nth) => {
                    child.style.height = `${height}%`
                    child.style.top = `${height * (nth - start)}%`
                })
        }
    }
}