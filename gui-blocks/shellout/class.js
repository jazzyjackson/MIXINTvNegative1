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

    /* needs an action to flip attribute word wrap */
    /* might want to generalize a method for chooosing among attributes */
    /* or just, each element has an attribute submenu, and a dropdown provided for each thing to customize */
    scrollToBottom(){
        // ask the parentNode to scroll down, if it has a method to do so
        !this.getAttribute('ignoreUpdate')
        && this.shadowParent
        && this.shadowParent.scrollToBottom
        && this.shadowParent.scrollToBottom()
    }


    sendSignal(signal){
        if(this.props['exit-code'] || this.props['exit-signal']) throw new Error("You shouldn't try to kill a process that's already over.")
        /* I have to figure out why the pid represents the shell on linux, but the process itself on darwin */
        /* anyway, I have to kill 'the parent of pid', or if that fails, try 'kill the pid' */
        fetch(`/?pkill -${signal} -P ${this.props.pid} || kill -${signal} ${this.props.pid}`,{
            method: 'POST',
            credentials: 'same-origin'
        })
    }

    sendStdin(command){
        if(this.props['exit-code'] || this.props['exit-signal']) throw new Error("There's no process to send follow up commands to.")        
        
        // echo the input to the stdout
        this.stdout.textContent += command + '\n'
        
        fetch('/?' + encodeURIComponent(command), {
            method: 'POST', 
            credentials: 'same-origin',            
            headers: { "x-for-pid": this.props.pid }
        })
    
    }

    subscribeToShell(command){
        let shell = new EventSource(location.pathname + '?' + encodeURIComponent(command) , {credentials: "same-origin"})
        this.header.textContent = location.pathname + ' → ' + this.props.action
        
        shell.addEventListener('pid', event => {
            this.setAttribute('pid', event.data)
            this.scrollToBottom()
        })
        shell.addEventListener('stdout', event => {
            this.stdout.textContent += JSON.parse(event.data)
            this.scrollToBottom()
        })
        shell.addEventListener('stderr', event => {
            this.stderr.textContent += JSON.parse(event.data)
            this.scrollToBottom()
        })
        shell.addEventListener('error', event => {
            this.error.textContent += JSON.stringify(JSON.parse(event.data), null, 4)
            this.scrollToBottom()
        })

        shell.addEventListener('close', event => {
            shell.close()
            var exit = JSON.parse(event.data)
            exit.signal ? this.setAttribute('exit-signal', exit.signal)
                        : this.setAttribute('exit-code', exit.code)
        })
    }
}  