class TextareaBlock extends ProtoBlock {
    constructor(){
        super()
        this.addEventListener('init', () => {
            this.header = this.shadowRoot.querySelector('header')
            this.headerTitle = this.shadowRoot.querySelector('header-title')
            this.textarea = this.shadowRoot.querySelector('textarea')
            if(this.props.src){
                this.fetchFile(this.props.src)
                this.textarea.setAttribute('disabled',true) /* this is a choice, I like the idea of making you explicitely edit the file instead of accidentally deleting stuff and noticing it has unsaved changes later... */
            }else{
                this.props = {src: prompt("I need a name for this new file:")}
            }
            this.headerTitle.textContent = this.props.src
        })
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))                
    }

    fetchFile(source){
        this.headerTitle.textContent = '...'        
        this.props = {lastUpdate: Date.now()} 
        fetch(source, {
            method: 'get',
            credentials: 'same-origin',
            redirect: 'error' 
        })
        .then(response => {
            this.headerTitle.textContent = response.url.slice(location.origin.length)
            return response
        })
        .then(response => response.text())
        .then(text => {
            this.textarea.textContent = text
        })
        .then(() => {
            this.dispatchEvent(new Event('load'))
        })
        .catch(error => {
            this.props = {error}
            this.textarea.textContent = error
        })
    }
}