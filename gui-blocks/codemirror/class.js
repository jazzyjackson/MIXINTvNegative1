class CodemirrorBlock extends TextareaBlock {
  constructor(props){
      super(props)

      // this load will fire when the fetch for the file (in src attribute) completes
      this.addEventListener('load', () => {
          // this promise will resolve immediately if the script is already available
            this.loadLocalStyle('/gui-blocks/codemirror/assets/lib/codemirror.css')
            .then(()=> this.attachGlobalScript('/gui-blocks/codemirror/assets/lib/codemirror.js'))
            .then(()=>{
                this.cm = CodeMirror.fromTextArea(this.child['textarea'], {
                    lineNumbers: true,
                    mode: null
                })
                this.setHighlightMode(this.props.src)
            })
        })
    }

    
    setHighlightMode(filename){
        return this.attachGlobalScript('/gui-blocks/codemirror/assets/mode/meta.js')
        .then(() => CodeMirror.findModeByFileName(filename).mode)
        .then(mode => {
            console.log(`Setting codemirror mode to ${mode}`)
            if(mode === 'htmlmixed'){
                return Promise.all([
                    this.attachGlobalScript('/gui-blocks/codemirror/assets/mode/javascript/javascript.js'),
                    this.attachGlobalScript('/gui-blocks/codemirror/assets/mode/css/css.js'),
                    this.attachGlobalScript('/gui-blocks/codemirror/assets/mode/xml/xml.js')])
                    .then(()=> this.attachGlobalScript('/gui-blocks/codemirror/assets/mode/htmlmixed/htmlmixed.js'))
            } else {
                return this.attachGlobalScript(`/gui-blocks/codemirror/assets/mode/${mode}/${mode}.js`)
            }
        })
        .then(() => {
            this.cm.setOption('mode', CodeMirror.findModeByFileName(filename).mode);
        })
    }
}