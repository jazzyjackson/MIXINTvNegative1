class ShelloutBlock extends ProtoBlock {
    constructor(){
        super()
        this.addEventListener('init', () => {
            this.header = this.shadowRoot.querySelector('header')
            this.shell = this.shadowRoot.querySelector('data-shell')
            this.stdout = this.shadowRoot.querySelector('data-stdout')
            this.stderr = this.shadowRoot.querySelector('data-stderr')
            this.error = this.shadowRoot.querySelector('data-error')
            this.footer = this.shadowRoot.querySelector('footer')
            if(!this.props.bash) this.props = {bash: prompt('I need a bash command to execute:')}
            this.subscribeToShell(this.props.bash)
        })
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))                
    }

    sendSignal(signal){
        fetch(`/?pkill -${signal} -P ${this.props.pid}`,{
            method: 'POST',
            credentials: 'same-origin'
        })
    }

    subscribeToShell(command){
        let spring = new EventSource(location.pathname + '?' + command, {credentials: "same-origin"})
        this.header.textContent = location.pathname + ' → ' + this.props.bash
        
        spring.addEventListener('pid', event => {
            this.setAttribute('pid', event.data)
        })
        spring.addEventListener('stdout', event => {
            this.stdout.textContent += JSON.parse(event.data)
            this.shell.scrollTop = this.shell.scrollHeight
        })
        spring.addEventListener('stderr', event => {
            this.stderr.textContent += JSON.parse(event.data)
            this.shell.scrollTop = this.shell.scrollHeight            
        })
        spring.addEventListener('error', event => {
            this.error.textContent += JSON.stringify(JSON.parse(event.data), null, 4)
            this.shell.scrollTop = this.shell.scrollHeight            
        })

        spring.addEventListener('close', event => {
            var exit = JSON.parse(event.data)
            exit.signal ? this.setAttribute('exit-signal', exit.signal) 
                        : this.setAttribute('exit-code', exit.code)
            spring.close()
        })
    }
}  