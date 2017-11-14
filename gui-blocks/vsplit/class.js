class VsplitBlock extends MultiplexBlock {
    constructor(props){
        super(props)
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))        
    }

    deflate(node){
        node.style.display = 'none' // hide
        node.style.opacity = 0
        console.log("deflating")
    }

    inflate(node){  
        console.log("inflating")
        if(node.style.left){
            node.style.left = parseInt(node.style.left) + (100 / this.showMax) + '%'            
        }
        setTimeout(()=>{
            console.log("inflating timeout")        
            node.style.display = null // show   
            node.style.opacity = 1        
            // opacity is being transitioned to 1 and then removed
            // node.style.opacity = null
            setTimeout(()=>{
                this.reCalculateChildren() 
            })             
        })
    }

    reCalculateChildren(){
        switch(this.shadowRoot.childElementCount - 1){
            case 0: this.shadowRoot.appendChild(new BecomeBlock); break;
            case 1: this.shadowRoot.children[1].style.width = '100%'; this.shadowRoot.children[1].style.left = '0px'; break;
            default: 
                let width = 100 / this.showMax
                let start = this.showStart
                Array.from(this.shadowRoot.children, (child, nth) => {
                    child.style.width = `${width}%`
                    child.style.left = `${width * (nth - start)}%`
                })
        }
    }
}