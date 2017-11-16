class ShowdownBlock extends TextareaBlock {
    constructor(props){
        super(props)
    
        // this load will fire when the fetch for the file (in src attribute) completes
        this.addEventListener('load', () => {
            // this promise will resolve immediately if the script is already available
            this.attachGlobalScript('/gui-blocks/showdown/assets/showdown.js').then(()=>{
                this.converter = new showdown.Converter
                this.child['showdown-container'].innerHTML = this.converter.makeHtml(this.data)
                this.child['textarea'].style.display = 'none'
            })
        })
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))
                         && this.dispatchEvent(new Event('ready'))
    }
}