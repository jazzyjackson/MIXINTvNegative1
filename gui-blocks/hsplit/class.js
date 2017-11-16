class HsplitBlock extends MultiplexBlock {
    constructor(props){
        super(props)
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))
                         && this.dispatchEvent(new Event('ready'))
    }

    deflate(node){
        node.style.display = 'none' // hide
        node.style.opacity = 0
        console.log("deflating")
    }

    inflate(node){  
        console.log("inflating")
        if(node.style.top){
            node.style.top = parseInt(node.style.top) + (100 / this.showMax) + '%'            
        }
        setTimeout(()=>{
            console.log("inflating timeout")        
            node.style.display = null // show   
            node.style.opacity = 1        
            // opacity is being transitioned to 1 and then removed
            setTimeout(()=>{
                this.reCalculateChildren() 
            })                       
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