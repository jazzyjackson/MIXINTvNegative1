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
    scrollToBottom(){
        // ask the parentNode to scroll down, if it has a method to do so
        !this.getAttribute('ignoreUpdate')
        && this.shadowParent
        && this.shadowParent.scrollToBottom
        && this.shadowParent.scrollToBottom()
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
        let spring = new EventSource(location.pathname + '?' + encodeURIComponent(command), {credentials: "same-origin"})
        this.header.textContent = location.pathname + ' → ' + command

        spring.addEventListener('pid', event => {
            this.setAttribute('pid', event.data)
            this.scrollToBottom()
        })

        spring.addEventListener('stdout', event => {
            let newData = JSON.parse(event.data)
            if(typeof newData == 'object'){
                /* if some process returned an object, take those objects properties and make them attributes of this block */
                this.props = newData
            } else {
                /* There's a couple things to handle when digesting stdout from bash - the man pages do this thing where */
                /* a\ba (backspace) is like a double-typed a that should be displayed bold, but for now I just want to throw out the doubled up letters */
                let backspacedString = newData.replace(/.[\b]/g, '') // delete groups of any character followed by backspace. Later I might use a replacement function like (x,y) => <em>newstring[x]</em> or whatever */
                this.stdout.textContent += backspacedString
            }
            this.scrollToBottom()            
        })

        spring.addEventListener('stderr', event => {
            this.setAttribute('error', true)
            this.stderr.textContent += JSON.parse(event.data)
            this.shell.scrollTop = this.shell.scrollHeight   
            this.scrollToBottom()
        })
        
        spring.addEventListener('error', event => {
            let error = JSON.parse(event.data)
            this.setAttribute('errno', error.errno)
            /* this is child_process.exec throwing an error, not the subprocess */
            spring.close()
            this.error.textContent += JSON.stringify(error, null, 4)
            this.shell.scrollTop = this.shell.scrollHeight   
            this.scrollToBottom()
        })

        spring.addEventListener('close', event => {
            spring.close()
            var exit = JSON.parse(event.data)
            exit.signal ? this.setAttribute('exit-signal', exit.signal)
                        : this.setAttribute('exit-code', exit.code)
            this.scrollToBottom()
        })
    }
}  