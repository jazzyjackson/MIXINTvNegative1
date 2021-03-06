class ImageBlock extends ProtoBlock {
    constructor(props){
        super(props)
        // Media Block is to provide various interfaces to files on disk (or remote, but anyway something referred to via src attribute)
        // TextArea fetches the file and sets this.data as the source contents
        // Image, Audio, Video, iframe uses a hidden textarea to keep a list (you might call it a playlist) of media to set as the src of built in HTML Nodes
        // You have the option to get link to source, download the source file, delete the source file (if you have write permission)
        this.addEventListener('ready', () => {
            this.child['img'].setAttribute('src', this.props.src || this.data.split('\n')[0])
            if(this.props.interpret){
                this.header = this.props.interpret
                this.child['header'].style.background = 'white'
                this.child['header'].style.color = 'black'
                this.child['img-caption'].textContent = this.props.stdout
            }
        })
    }
}