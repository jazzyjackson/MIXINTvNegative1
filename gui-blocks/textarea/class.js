class TextareaBlock extends ProtoBlock {
    constructor(){
        super()
    }

    connectedCallback(initializing){
        if(initializing || this.hasntBeenInitializedYet()){
            this.header = this.shadowRoot.querySelector('header')
            this.textarea = this.shadowRoot.querySelector('textarea')
            if(!this.props.src) this.props = {src: undefined}
        }
    }

    static get observedAttributes(){
        return ['src']
    }

    attributeChangedCallback(attr, newVal, oldVal){
        switch(attr){
            case 'src':
                this.header.textContent = this.props.src
                newVal && this.fetchFile(newVal)
                break
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