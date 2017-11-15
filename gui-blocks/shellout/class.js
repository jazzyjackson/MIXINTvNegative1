class ShelloutBlock extends ProtoBlock {
    constructor(props){
        super(props)
        this.addEventListener('init', () => {
            console.log("shellout called from", this.tagName)
            
            this.stdout = this.shadowRoot.querySelector('data-stdout')
            this.stderr = this.shadowRoot.querySelector('data-stderr')
            this.error = this.shadowRoot.querySelector('data-error')
                        
            if(!this.props.action) this.props = {action: prompt('I need a bash command to execute:')}
            this.subscribeToShell(this.props.action)
        })
    }
    
    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))
    }

    disconnectedCallback(){
        // this only fires if a shellout node was explicitely removed from the DOM tree
        // this DOES NOT FIRE when a user navigates away from the page 
        // if(this.pid && (this.props['exit-code'] || this.props['exit-signal'])){
        console.log("disconnected", this)
        // if(this.pid && !this.props['exit-code'] && !this.props['exit-signal']){
        //     this.sendSignal("KILL")
        // }       
        // }        
    }

    get workingDirectory(){
        return this.getAttribute('cwd') || location.pathname
    }

    static get observedAttributes() {
        // possible object properties you expect spiders to return
        return [
            'pid',
            'eval',
            'timeout',
            'newSibling',
            'become',
            'stdout',
            'stderr',
            'error',
            'exit-signal',
            'exit-code',
        ]
    }

    attributeChangedCallback(attr, oldValue, newValue) {
        switch(attr){
            // for either stderr, stdout, or err, append value to appropriate shell category, but also append to hidden textarea incase block is transformed or saved to disk. 
            case 'stdout':
            case 'stderr':
            case 'error': 
                this[attr].textContent += newValue;
                this.textarea.textContent += newValue;   
                break;
            case 'timeout':
                // this will need to parse chatbot response and set a timeout that's cancelled on submit...
                // var time = parseInt(newValue)
                // for now let's just immediately submit chat response so chatscript can trigger programs for us
                this.shadowParent.appendChild(new ShelloutBlock({
                    header: newValue,
                    action: `printf ${btoa(JSON.stringify(newValue))} | base64 --decode | node interpret`, 
                    autofocus: false, 
                    cwd: '/spiders/'
                }));
                break;
            case 'eval':
                eval(newValue);
                break;
            case 'newSibling':
                // this should be an object that includes, src, action, become, etc
                this.insertSibling(new ProtoBlock(JSON.parse(newValue))); 
                break;
            case 'become':
                // hmmm make sure that I have the attributes I need before becoming the new thing 
                if(this.shell.readyState == 0) this.become(newValue)
                else this.addEventListener('load', () => this.become(newValue))
                break;
            case 'exit-signal':
            case 'exit-code':
                this.shell.close()
                this.dispatchEvent(new Event('load')) // done loading
            default:
                console.log("You didn't give me anything to do with " + attr)
        }
        this.scrollParentToBottom()
    }        
    /* needs an action to flip attribute word wrap */
    /* might want to generalize a method for chooosing among attributes */
    /* or just, each element has an attribute submenu, and a dropdown provided for each thing to customize */
    scrollParentToBottom(){
        // ask the parentNode to scroll down, if it has a method to do so
        // I forget why I can't just do this.scrollIntoView(), I think it tried to scroll the whole viewport, instead of the immediate parent
        !this.getAttribute('ignoreUpdate')
        && this.shadowParent
        && this.shadowParent.scrollToBottom
        && this.shadowParent.scrollToBottom()
        // instead of scrolling I could also keep track of whether there has been an update since the div was last in view, have a little tooltip, scroll up to see new data 
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
        this.shell = new EventSource(this.workingDirectory + '?' + encodeURIComponent(command) , {
            credentials: "same-origin"
        })

        this.shell.addEventListener('message', event => {
            this.props = JSON.parse(event.data)
        })
    }
}  