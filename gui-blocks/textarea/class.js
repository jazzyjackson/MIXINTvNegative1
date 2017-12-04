class TextareaBlock extends MediaBlock {
    constructor(props){
        super(props)
        this.addEventListener('init', () => {

        })
        this.addEventListener('ready', () => {
            if(this.props.src && this.props.src.slice(-1) != '/'){
                this.fetchFile(this.props.src)
                // this.textarea.setAttribute('disabled',true) /* this is a choice, I like the idea of making you explicitely edit the file instead of accidentally deleting stuff and noticing it has unsaved changes later... */
            } else {
                // if this.props.src is a directory, use that as a prefix to the new filename. so if you make a directory become a text area, that's a way to make a new file in that directory.
                this.props = {src: (this.props.src || '/') + prompt("I need a name for this new file:")}
                this.header = this.props.src
                this.fetchFile(this.props.src)                
                // oh yeah new file can just be "this.become(text-area)" or "this.insertAdjacentElement('afterend',new TextareaBlock({src: this.props.src})"
            }
        })
    }


    static get actions(){
        return [
            {"overwrite": {
                func: this.prototype.overwrite,
                args: [{input: "filename"}],
                default: [ctx => ctx.getAttribute('src')],
                info: "Write file to disk with given source as pathname"
            }},
            {"interpret": {
                func: this.prototype.interpret,
                args: [{input: "command"}],   
                default: [ctx => ctx.data.slice(0,2) == '#!'
                                    ? `chmod +x .${ctx.getAttribute('src')} && .${ctx.getAttribute('src')}`
                                    : `cat .${ctx.getAttribute('src')} | xargs echo`]
            }},
            {"toggle word wrap": {
                func: HTMLElement.prototype.setAttribute,
                args: [{label: "whitespace"},{select: ["wrap","no wrap"]}],
                default: [() => "whitespace", ctx => {
                    return ctx.getAttribute("whitespace") == "wrap" ? "no wrap" : "wrap"
                }]
            }},
        ]
    }

    interpret(command){
        console.log(command)
        this.insertAdjacentElement('afterend',new ShelloutBlock({
            // will execute 'sh ' + this.props.src
            // so this file better be executable as a shell script
            // with #! magic number at the top
            header: this.props.src,
            exec: this.props.src.slice(1) // drop the leading slash
        }))
    }

    overwrite(source){
        if(!confirm(`Please tell me it's O.K. to overwrite ${source.split('/').slice(-1)} with the current data`)){
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
            body: this.data
        }).then(() => {
            this.setAttribute('src', source)
            this.header = this.props.src
        }).catch(console.error) 
        // .then fetch post git add $source && git commit -m "prompt(what should the message be" ? maybe something like this

        // lol it would be kinda cool to pinwheel the X while things are happening, but it might be kinda annoying
        // oh how about a background animation, a sort of rotating shadow...
    }

    fetchFile(source){
        this.props = {lastUpdate: Date.now()} 
        fetch(source.split('/').map(encodeURIComponent).join('/'), {
            method: 'get',
            credentials: 'same-origin',
            redirect: 'error' 
        })
        .then(response => response.text())
        .then(text => {
            this.data = text
        })
        .then(() => {
            this.dispatchEvent(new Event('load'))
        })
        .catch(error => {
            this.props = {error}
            this.data = error
        })
    }
}