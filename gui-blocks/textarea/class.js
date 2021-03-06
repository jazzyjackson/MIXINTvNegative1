class TextareaBlock extends ProtoBlock {
    constructor(props){super(props)}

    static build(){
        // actually if there's no this.props.src by now I want to open a pop up library block to choose / create one. that's be so neat.
        if(this.props.src && this.props.src.slice(-1) != '/'){
            this.fetchFile(this.props.src)
            // this.textarea.setAttribute('disabled',true) /* this is a choice, I like the idea of making you explicitely edit the file instead of accidentally deleting stuff and noticing it has unsaved changes later... */
        } else {
            // if this.props.src is a directory, use that as a prefix to the new filename. so if you make a directory become a text area, that's a way to make a new file in that directory.
            this.props = {src: (this.props.src || '/') + prompt("I need a name for this new file:")}
            this.header = this.props.src
            // oh yeah new file can just be "this.become(text-area)" or "this.insertSibling(new TextareaBlock({src: this.props.src})"
        }
        this.props.src = this.resolvePath(this.props.src) || '/'
        this.child['header-title'].textContent = this.props.src
        this.props.lastUpdate = Date.now()
    }


    static get actions(){
        return [
            {"overwrite": {
                func: this.prototype.overwrite,
                args: [{input: "filename"}],
                default: [ctx => ctx.getAttribute('src')],
                info: "Write file to disk with given source as pathname"
            }},
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
            {"delete from disk": {
                func: this.prototype.rm,
                info: "sends the 'rm' command to delete this file from disk."
            }}
        ]
    }

    rm(){
        // return fetch('/rm?' + encodeURIComponent(`${this.props.src}`), {
        //     method: 'post',
        //     credentials: 'same-origin',
        //     redirect: 'error'
        // })
        // .then(()=>{
        //     this.remove()
        // }) // calling this.become with no argument re-creates / re-loads the current block from src
        // .catch(console.error)
    }

    download(filename){
        // fyi if you download a hidden file chrome, at least, is likely to mutate your filename, dropping the leading dot
        let a = document.createElement('a')
        a.setAttribute('download', filename.split('/').slice(-1)) // strip full path from filename
        a.setAttribute('href', filename)
        a.click()
    }

    copy2clipboard(filename){
        // this doesn't work yet but I havent really looked into it, maybe I'm using firefox function?
        document.execCommand('copy');
        this.addEventListener('copy', event => {
            event.preventDefault()
            event.clipboardData.setData('text/plain', filename);
        })
    }

    interpret(command){
        console.log(command)
        this.insertSibling(new EventioBlock({src: command}))
    }

    overwrite(source){
        if(!confirm(`Please tell me it's O.K. to overwrite ${source.split('/').slice(-1)} with the current data`)){
            /* 
            This is temporary until I make an auto-git-commit hook allowing you to undo a file save
            Here's a nice blog on how much better undo is than confirm: https://alistapart.com/article/neveruseawarning
            */
            return null // exit overwrite function if it's not OK
        }

        kvetch.put(source, null, this.data)
              .then(console.log).catch(console.error) 
        // .then fetch post git add $source && git commit -m "prompt(what should the message be" ? maybe something like this

        // lol it would be kinda cool to pinwheel the X while things are happening, but it might be kinda annoying
        // oh how about a background animation, a sort of rotating shadow...
    }

    fetchFile(source){
        this.props = {lastUpdate: Date.now()} 
        kvetch.get(source)
        .then(response => response.text())
        .then(text => {
            this.data = text
            this.readyState = 'complete'
        })
        .catch(error => {
            this.props.error = error
            this.data = error
        })
    }
}