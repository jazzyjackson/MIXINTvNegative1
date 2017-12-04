class MediaBlock extends ProtoBlock {
    constructor(props){
        super(props)
        // Media Block is to provide various interfaces to files on disk (or remote, but anyway something referred to via src attribute)
        // TextArea fetches the file and sets this.data as the source contents
        // Image, Audio, Video, iframe uses a hidden textarea to keep a list (you might call it a playlist) of media to set as the src of built in HTML Nodes
        // You have the option to get link to source, download the source file, delete the source file (if you have write permission)
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
            {"delete from disk": {
                func: this.prototype.rm,
                info: "sends the 'rm' command to delete this file from disk."
            }}
        ]
    }

    rm(){
        return fetch('/?' + encodeURIComponent(`rm ./${this.props.src}`), {
            method: 'post',
            credentials: 'same-origin',
            redirect: 'error'
        })
        .then(()=>{
            this.remove()
            // textareas opened from a directory should retain a reference to directory
            // so when its removed, originating directory can be refreshed
            // if directory was since destroyed (id returns undefined) no big deal
        }) // calling this.become with no argument re-creates / re-loads the current block from src
        .catch(console.error)
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
        // document.execCommand('copy');
        // this.addEventListener('copy', event => {
        //     event.preventDefault()
        //     event.clipboardData.setData('text/plain', filename);
        // })
    }
}