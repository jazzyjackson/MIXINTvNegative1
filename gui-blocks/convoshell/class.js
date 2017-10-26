class ConvoshellBlock extends ProtoBlock {
    constructor(){
        super()
        this.addEventListener('init', () => {
            this.convoForm = this.shadowRoot.querySelector('convo-form')
            this.form = this.shadowRoot.querySelector('form')
            this.input = this.shadowRoot.querySelector('convo-form input')

            this.form.addEventListener('submit', event => {
                event.preventDefault()
                if(this.getAttribute('mode') == 'party'){
                    // fetch POST message, disable submit until POST is finished
                } else {
                    let shellout = new ShelloutBlock
                    shellout.props = { action: this.input.value }
                    this.shadowRoot.insertBefore(shellout, this.convoForm)
                    // shellout.addEventListener('load', () => this.form.scrollIntoView())                    
                } 
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

    /* be aware that this IP is self reported - checked against the server but written by the client - a client could easily spoof this by modifying code in their browser. For more accurate, but still remotely-spoofable, IP access, check the logs kept by bookkeeper.js */
}