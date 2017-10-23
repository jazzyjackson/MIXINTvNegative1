class ThreadBlock extends ProtoBlock {
    constructor(){
        super()
        this.addEventListener('init', () => {
            this.form = this.shadowRoot.querySelector('form')
            this.addButton = this.shadowRoot.querySelector('add-button')
            this.dropdown = this.shadowRoot.querySelector('select')
            window.defaultFig.blocks.forEach(block => {
                let newOption = document.createElement('option')
                newOption.textContent = block
                this.dropdown.appendChild(newOption)
            })

            this.form.addEventListener('submit', event => {
                event.preventDefault()                
                this.shadowRoot.insertBefore(document.createElement(this.dropdown.value + '-block'), this.addButton)
                this.form.scrollIntoView()
            })
        })
    }

    static get actions(){
        return {
            "rotate thread": {
                func: HTMLElement.prototype.setAttribute.bind(this, 'orientation'),
                args: [{select: ['vertical','horizontal']}],
            }
        }
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))                
    }
}