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
            if(!this.props.action) this.props = {action: prompt('I need a bash command to execute:')}
            this.subscribeToShell(this.props.action)
        })
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))                
    }

    sendSignal(signal){
        /* I have to figure out why the pid represents the shell on linux, but the process itself on darwin */
        /* anyway, I have to kill 'the parent of pid', or if that fails, try 'kill the pid' */
        fetch(`/?pkill -${signal} -P ${this.props.pid} || kill -${signal} ${this.props.pid}`,{
            method: 'POST',
            credentials: 'same-origin'
        })
    }

    subscribeToShell(command){
        let spring = new EventSource(location.pathname + '?' + command, {credentials: "same-origin"})
        this.header.textContent = location.pathname + ' → ' + command
        
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