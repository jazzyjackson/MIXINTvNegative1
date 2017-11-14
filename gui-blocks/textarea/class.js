class TextareaBlock extends ProtoBlock {
    constructor(props){
        super(props)
        this.addEventListener('init', () => {
            this.header = this.shadowRoot.querySelector('header')
            this.headerTitle = this.shadowRoot.querySelector('header-title')
            this.textarea = this.shadowRoot.querySelector('textarea')
            if(this.props.src && this.props.src.slice(-1) != '/'){
                this.fetchFile(this.props.src)
                // this.textarea.setAttribute('disabled',true) /* this is a choice, I like the idea of making you explicitely edit the file instead of accidentally deleting stuff and noticing it has unsaved changes later... */
            }else{
                this.props = {src: (this.props.src || '') + prompt("I need a name for this new file:")}
            }
            this.headerTitle.textContent = this.props.src
        })
    }

    static get actions(){
        return [
            {"get link": {
                func: this.prototype.copy2clipboard,
                args: [{input: "filename"}],
                default: [ctx => location.origin + ctx.getAttribute('src')],
                info: "Copies link to clipboard. Not plugged in yet, but you can copy the link manually."
            }},
            {"download": {
                func: this.prototype.download,  
                args: [{input: "filename"}],
                default: [ctx => location.origin + ctx.getAttribute('src')],
                info: "Creates an ephemeral <a href download> tag and clicks on it for you."
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

    download(filename){
        let a = document.createElement('a')
        a.setAttribute('download', filename.split('/').slice(-1)) // strip full path from filename
        a.setAttribute('href', filename)
        a.click()
    }

    copy2clipboard(filename){
        
    }

    interpret(command){
        let newSibling = new ShelloutBlock()
        newSibling.props = {action: command}
        this.insertSibling(newSibling)
    }

    overwrite(source){
        if(!confirm(`Please tell me it's O.K. to overwrite ${source.split('/').slice(-1)} with the current textContent`)){
            /* 
            This is temporary until I make an auto-git-commit hook allowing you to undo a file save
            Here's a nice blog on how much better undo is than confirm: https://alistapart.com/article/neveruseawarning
            */
            return null // exit overwrite function if it's not OK
        }

        fetch(source.split('/').map(encodeURIComponent).join('/'), {
            method: 'put',
            credentials: 'same-origin',
            redirect: 'error',
            body: this.textarea.value
        }).then(console.log).catch(console.error) 
        // .then fetch post git add $source && git commit -m "prompt(what should the message be" ? maybe something like this

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