class ConvoshellBlock extends ProtoBlock {

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))
                         && this.dispatchEvent(new Event('ready'))
    }

    constructor(props){
        super(props)
        this.addEventListener('init', () => {
            // identity represents username of node process that ran figjam.js to create this HTML
            this.identity = document.querySelector('meta[user-identity]').getAttribute('user-identity')
            this.child['form'].addEventListener('submit', this.handleSubmit.bind(this))
            this.child['form'].addEventListener('keydown', event => {
                if(event.type == 'keydown' && event.key == 'Enter'){
                    event.stopPropagation()
                }
            })

            this.child['input'].addEventListener('focus', () => this.setAttribute('talking', true))
            this.child['input'].addEventListener('blur', () => this.setAttribute('talking', null))    
            // menu-block will attach a onready event to focus the parent
            // but that listener is attached before this one (when menu is attached to template's document fragment)
            // so this one will fire afterward, and refocus on the input
                    
            this.addEventListener('ready', () => {
                this.header = `${this.identity}@${location.hostname} talking to self`
                this.child['input'].focus()
            })

            this.addEventListener('resize', () => {
                if(this.props.talking) this.child['input'].focus()
            })
        })

    }

    handleSubmit(event){
        event.preventDefault()
        if(this.getAttribute('mode') == 'party'){
            // fetch POST message, disable submit until POST is finished
        } else {        
            let shellout = new ShelloutBlock({
                header: this.child['input'].value,
                action: this.child['input'].value,
                autofocus: false
            })
            this.child['convo-body'].insertBefore(shellout, this.child['convo-form'])
            this.child['input'].value = ''
        }
    }

    scrollToBottom(){
        this.child['convo-body'].scrollTop = Number.MAX_SAFE_INTEGER
    }

    static get actions(){
        return [
            /* maybe I can open top in a new sibling */
        ]
    }


    /* be aware that this IP is self reported - checked against the server but written by the client - a client could easily spoof this by modifying code in their browser. For more accurate, but still remotely-spoofable, IP access, check the logs kept by bookkeeper.js */
}