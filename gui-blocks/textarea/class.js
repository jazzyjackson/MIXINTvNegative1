class TextareaBlock extends ProtoBlock {
    constructor(){
        super()
        this.addEventListener('init', () => {
            console.log("calling src")
            this.header = this.shadowRoot.querySelector('header')
            this.textarea = this.shadowRoot.querySelector('textarea')
            this.getAttribute('src') || this.setAttribute('src', 'untitled')
        })
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))                
    }

    static get observedAttributes(){
        return ['src']
    }

    attributeChangedCallback(attr, oldVal, newVal){
        console.log("changed", attr)
        switch(attr){
            case 'src':
                console.log('case src, newval:',newVal)
                this.header.textContent = newVal
                newVal != 'untitled' && this.fetchFile(newVal)
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