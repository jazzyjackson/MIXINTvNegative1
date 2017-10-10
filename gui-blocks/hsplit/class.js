class HsplitBlock extends HTMLElement {
    constructor(){
        super()
    }

    connectedCallback(){
        if(!this.shadowRoot){
            this.attachShadow({mode: 'open'})
            this.shadowRoot.appendChild(document.querySelector(`[renders="${this.tagName.toLowerCase()}"]`).content.cloneNode(true))  
            console.log(this)
            let nodesToMove = Array.from(this.children)
            nodesToMove.forEach(node => {
                this.shadowRoot.appendChild(node)
            })
            if(this.children.length == 0){
                this.shadowRoot.appendChild(new BecomeBlock)
                this.shadowRoot.appendChild(new BecomeBlock)
            }
        }
    }
}