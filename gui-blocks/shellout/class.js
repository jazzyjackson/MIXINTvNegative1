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

    /* needs an action to flip attribute word wrap */
    /* might want to generalize a method for chooosing among attributes */
    /* or just, each element has an attribute submenu, and a dropdown provided for each thing to customize */

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
            this.getAttribute('ignoreUpdate') || (this.shadowParent.scrollTop = this.shadowParent.scrollHeight)
        })

        spring.addEventListener('stdout', event => {
            let newString = JSON.parse(event.data)
            this.stdout.textContent += newString.replace(/.[\b]/g, (y,z) => newString[z+1])
            console.log(JSON.parse(event.data))
            this.getAttribute('ignoreUpdate') || (this.shadowParent.scrollTop = this.shadowParent.scrollHeight)
        })
        spring.addEventListener('stderr', event => {
            this.setAttribute('error', true)
            this.stderr.textContent += JSON.parse(event.data)
            this.shell.scrollTop = this.shell.scrollHeight   
            this.getAttribute('ignoreUpdate') || (this.shadowParent.scrollTop = this.shadowParent.scrollHeight)
        })
        spring.addEventListener('error', event => {
            let error = JSON.parse(event.data)
            this.setAttribute('errno', error.errno)
            /* this is child_process.exec throwing an error, not the subprocess */
            spring.close()
            this.error.textContent += JSON.stringify(error, null, 4)
            this.shell.scrollTop = this.shell.scrollHeight   
            this.getAttribute('ignoreUpdate') || (this.shadowParent.scrollTop = this.shadowParent.scrollHeight)
        })

        spring.addEventListener('close', event => {
            spring.close()
            var exit = JSON.parse(event.data)
            exit.signal ? this.setAttribute('exit-signal', exit.signal)
                        : this.setAttribute('exit-code', exit.code)
            this.getAttribute('ignoreUpdate') || (this.shadowParent.scrollTop = this.shadowParent.scrollHeight)
        })
    }
}  