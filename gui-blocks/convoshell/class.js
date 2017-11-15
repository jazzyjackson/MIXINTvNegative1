class ConvoshellBlock extends ProtoBlock {

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))
    }

    constructor(props){
        super(props)
        this.addEventListener('init', () => {
            this.convoForm = this.shadowRoot.querySelector('convo-form')
            this.convoBody = this.shadowRoot.querySelector('convo-body')
            this.form = this.shadowRoot.querySelector('form')
            this.input = this.shadowRoot.querySelector('convo-form input')
            this.header = this.shadowRoot.querySelector('header')
            this.headerTitle = this.shadowRoot.querySelector('header-title')
            
            let username = document.querySelector('meta[user-identity]').getAttribute('user-identity')
            this.headerTitle.textContent = `${username}@${location.hostname} talking to self`
            this.form.addEventListener('submit', this.handleSubmit.bind(this))
            this.form.addEventListener('keydown', event => {
                if(event.type == 'keydown' && event.key == 'Enter'){
                    event.stopPropagation()
                }
            })
            this.setAttribute('autofocus', false)
            setTimeout(() => this.input.focus(), 100)

        })
    }

    handleSubmit(event){
        event.preventDefault()
        if(this.getAttribute('mode') == 'party'){
            // fetch POST message, disable submit until POST is finished
        } else {
            let shellout = new ShelloutBlock({
                header: this.input.value,
                action: this.input.value, 
                autofocus: false
            })
            this.convoBody.insertBefore(shellout, this.convoForm)
            this.input.value = ''
            this.input.focus()
        }
    }

    scrollToBottom(){
        this.convoBody.scrollTop = Number.MAX_SAFE_INTEGER
    }

    static get actions(){
        return [

        ]
    }


    /* be aware that this IP is self reported - checked against the server but written by the client - a client could easily spoof this by modifying code in their browser. For more accurate, but still remotely-spoofable, IP access, check the logs kept by bookkeeper.js */
}