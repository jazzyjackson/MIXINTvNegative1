class TextareaBlock extends ProtoBlock {
    constructor(){
        super()
        console.log("constructing textarea")
        this.addEventListener('init', () => {

            console.log("textrea initialized")
            this.header = this.shadowRoot.querySelector('header')
            this.textarea = this.shadowRoot.querySelector('textarea')
            this.getAttribute('src') || this.setAttribute('src', 'untitled')
            this.props.src != 'untitled' && this.fetchFile(this.props.src)
        })
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))                
    }

    fetchFile(source){
        this.header.textContent = '...'        
        this.props = {lastUpdate: Date.now()} 
        fetch(source, {
            method: 'get',
            credentials: 'same-origin',
            redirect: 'error' 
        })
        .then(response => {
            this.header.textContent = response.url.slice(location.origin.length)
            return response
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