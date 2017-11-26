class VsplitBlock extends MultiplexBlock {
    constructor(props){
        super(props)
        this.dimensionProp = 'width' || 'height'
        this.positionProp = 'left' || 'top'
    }

    // auto rotate width / height
    // on recalc number via tabindex
    // on recalc due to removedchild, grab tabindex and focus its replacement
    // on arrow left and right, increment the focused child
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
            case 0:
                this.shadowRoot.appendChild(new BecomeBlock); break;
            case 1: 
                this.shadowRoot.children[1].setAttribute('tabIndex',1)
                this.shadowRoot.children[1].focus()
                this.shadowRoot.children[1].style.width = '100%'; 
                this.shadowRoot.children[1].style.left = '0px'; 
                this.shadowRoot.children[1].dispatchEvent(new Event("resize"))
                break;
            default: 
                let width = 100 / this.showMax
                let start = this.showStart
                Array.from(this.shadowRoot.children, (child, nth) => {
                    child.setAttribute('tabIndex', nth)
                    child.style.width = `${width}%`
                    child.style.left = `${width * (nth - start)}%`
                    child.dispatchEvent(new Event("resize"))
                })
        }
    }
}