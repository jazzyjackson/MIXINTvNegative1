class TextareaBlock extends ProtoBlock {
    constructor(){
        super()
        this.addEventListener('init', () => {
            this.header = this.shadowRoot.querySelector('header')
            this.headerTitle = this.shadowRoot.querySelector('header-title')
            this.textarea = this.shadowRoot.querySelector('textarea')
            if(this.props.src){
                this.fetchFile(this.props.src)
                this.textarea.setAttribute('disabled',true) /* this is a choice, I like the idea of making you explicitely edit the file instead of accidentally deleting stuff and noticing it has unsaved changes later... */
            }else{
                this.props = {src: prompt("I need a name for this new file:")}
            }
            this.headerTitle.textContent = this.props.src
        })
    }

    static get actions(){
        return [
            {"get link": {
                func: this.prototype.become,
                args: [{select: window.defaultFig.blocks}],
                default: [ctx => ctx.tagName.toLowerCase()],
                info: "Instantiates a new node of the selected type, copying all attributes from this node to the new one."
            }},
            {"overwrite": {
                func: this.prototype.overwrite,
                args: [{input: "filename"}],
                default: [ctx => ctx.getAttribute('src')],
                info: "Write file to disk with given source as pathname"
            }},
            {"interpret": {
                func: this.prototype.interpret,
                args: [{input: "command"}],   
                default: [ctx => ctx.textarea.textContent.slice(0,2) == '#!'
                                    ? `chmod +x .${ctx.getAttribute('src')} && .${ctx.getAttribute('src')}`
                                    : `cat .${ctx.getAttribute('src')} | xargs echo`]
            }},
        ]
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))                
    }

    interpret(command){
        let newSibling = new ShelloutBlock()
        newSibling.props = {action: command}
        this.insertSibling(newSibling)
    }

    overwrite(source){
        fetch(source.split('/').map(encodeURIComponent).join('/'), {
            method: 'get',
            credentials: 'same-origin',
            redirect: 'error',
            body: this.textarea.textContent
        }).then(console.log).catch(console.error) 

        // lol it would be kinda cool to pinwheel the X while things are happening, but it might be kinda annoying
        // oh how about a background animation, a sort of rotating shadow...
    }

    fetchFile(source){
        this.headerTitle.textContent = '...'        
        this.props = {lastUpdate: Date.now()} 
        fetch(source.split('/').map(encodeURIComponent).join('/'), {
            method: 'get',
            credentials: 'same-origin',
            redirect: 'error' 
        })
        .then(response => {
            this.headerTitle.textContent = response.url.slice(location.origin.length)
            return response
        })
        .then(response => response.text())
        .then(text => {
            this.textarea.textContent = text
        })
        .then(() => {
            this.dispatchEvent(new Event('load'))
        })
        .catch(error => {
            this.props = {error}
            this.textarea.textContent = error
        })
    }
}