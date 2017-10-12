class TextareaBlock extends ProtoBlock {
    constructor(){
        super()
    }

    connectedCallback(){
        if(this.hasntBeenInitializedYet()){
            this.header = this.shadowRoot.querySelector('header')
            this.textarea = this.shadowRoot.querySelector('textarea')
            if(this.props.src){
                this.fetchFile(this.props.src)
            } else {
                this.props = {src: undefined}
            }
            this.header.textContent = this.props.src
        }
    }

    fetchFile(source){
        this.props = {lastUpdate: Date.now()} 
        fetch(source, {
            method: 'get',
            credentials: 'same-origin',
            redirect: 'error' 
        })
        .then(response => response.text())
        .then(text => {
            this.textarea.textContent = text
        })
        .catch(error => {
            this.props = {error}
            this.textarea.textContent = error
        })
    }
}