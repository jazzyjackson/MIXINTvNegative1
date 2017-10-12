class HsplitBlock extends HTMLElement {
    constructor(){
        super()
    }

    connectedCallback(){
        if(this.shadowRoot) return this
        /* attach shadow */
        this.attachShadow({mode: 'open'})
        var template = document.querySelector(`template[renders="${this.tagName.toLowerCase()}"]`)
        var shadowChild = template.content.cloneNode(true)
        this.shadowRoot.appendChild(shadowChild)  
        Array.from(this.children, child => this.shadowRoot.appendChild(child))

        /* but this is a split, so if I wasn't initialized with children, lets make some new ones */
        if(this.children.length == 0){
            this.shadowRoot.appendChild(new BecomeBlock)
            this.shadowRoot.appendChild(new BecomeBlock)
        }
    }
}