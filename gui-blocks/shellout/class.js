class ShelloutBlock extends ProtoBlock {
    constructor(props){
        super(props)
        this.addEventListener('init', () => {
            this.stdout = this.shadowRoot.querySelector('data-stdout')
            this.stderr = this.shadowRoot.querySelector('data-stderr')
            this.error = this.shadowRoot.querySelector('data-error')
            
            this.workingDirectory = this.getAttribute('cwd') || location.pathname
            
            if(!this.props.action) this.props = {action: prompt('I need a bash command to execute:')}
            this.subscribeToShell(this.props.action)
        })
    }
    
    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))
    }

    static get observedAttributes() {
        return ['name','pid','stdout','stderr','err','say']
    }

    attributeChangedCallback(attr, oldValue, newValue) {
        console.log(attr)
        console.log(this)
        switch(attr){
            case 'name': this.header.textContent = newValue; break;
            case 'say': this.stdout.textContent = newValue; break;
            // for either stderr, stdout, or err, append value to appropriate shell category, but also append to hidden textarea incase block is transformed or saved to disk. 
            case 'stdout':
            case 'stderr':
            case 'error': 
                this[attr].textContent += this.digestJSON(newValue) || ''               
                break;
            case 'eval':
                eval(newValue); break;
            case 'newSibling':
                // this should be an object that includes, src, action, become, etc
                this.insertSibling(new ProtoBlock(JSON.parse(newValue))); break;
            default:
                console.log("You didn't give me anything to do with " + attr)
        }
        this.scrollToBottom()
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

    digestJSON(possibleJSON){
        var responseData = JSON.parse(possibleJSON)        
        try {
            this.props = JSON.parse(responseData)
            this.textarea.textContent = responseData;                    
            // at first I was apprehensive about tryint to parse every single message coming from shell output, this might be a lot
            // but I figure, JSON.parse fails really quick, like first character isn't what it expected quick, so I don't think this actually has a lot of overhead, we'll see.
        } catch(e) {
            // no big deal, it didn't work out, keep falling down and fill out like normal
            if(typeof responseData == 'object'){
                this.props = responseData
            } else {
                this.textarea.textContent += responseData
                return responseData
            }
        }
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
        let shell = new EventSource(this.workingDirectory + '?' + encodeURIComponent(command) , {credentials: "same-origin"})
        /* the idea is,
            listen for all messages...
            if the event.name is JSON, for each in JSON.parse(event.data){setAttribute(event.name, event.data[name])
            not JSON ? setAttribute(event.name, JSON.parse(event.data)) // still json parse because quotes and special chars are JSON escaped, hopefully
            do the error formatting somewhere else
            I think I have to limit myself to a hardcoded list of acceptable attributes, but that's probably for the best. Different things I have plans for...
        
            well, if this is gonna be a subscription anyway, I might just be stuck on listening to stdout
            So really, I have to check if stdout is doubly wrapped JSON, and just digest that...
            But I could still have attributeChangedCallback to do various things once stdout does its digestion
        */

        shell.addEventListener('pid', event => {
            this.setAttribute('pid', event.data)
        })
        shell.addEventListener('stdout', event => {
            this.setAttribute('stdout', event.data)
        })
        shell.addEventListener('stderr', event => {
            this.setAttribute('stdout', event.data)
        })
        shell.addEventListener('error', event => {
            this.setAttribute('stdout', event.data)            
        })

        shell.addEventListener('close', event => {
            shell.close()
            var exit = JSON.parse(event.data) // coerce number into string so 0 isn't falsey? IIRC
            exit.signal ? this.setAttribute('exit-signal', exit.signal)
                        : this.setAttribute('exit-code', exit.code)
        })
    }
}  