class VsplitBlock extends MultiplexBlock {
    constructor(){
        super()
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))        
    }

    deflate(node){
        node.style.display = 'none' // hide
        node.style.width = 0
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
        let width = 100 / this.showMax
        let start = this.showStart
        Array.from(this.shadowRoot.children, (child, nth) => {
            child.style.width = `${width}%`
            child.style.left = `${width * (nth - start)}%`
        })
    }
}