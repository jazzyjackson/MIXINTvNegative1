class ShowdownBlock extends TextareaBlock {
    constructor(props){
        super(props)
        this.showdownOptions = {
            literalMidWordUnderscores: true
        }
    }

    static build(){
        // Listening for load event, prototype TextareaBlock reacts to src attribute
        Promise.all([
            new Promise(resolve => this.addEventListener('load', resolve)),
            this.attachGlobalScript(env.APP_HOME + '/gui-blocks/showdown/assets/showdown.js')
        ]).then(()=>{
            this.converter = new showdown.Converter(this.showdownOptions)
            this.child['showdown-container'].innerHTML = this.converter.makeHtml(this.data)
            this.child.textarea.style.display = 'none'
        })
    }
}