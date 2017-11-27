class ShelloutBlock extends ProtoBlock {

    static get actions(){
        return [
            {"send signal": {
                func: this.prototype.sendSig,
                args: [{select: ["HUP","INT","QUIT","ABRT","KILL","ALRM","TERM","CONT","STOP"]}],
                default: [() => "KILL"],
                info: "If the process has not exited on its own, this sends the selected signal to PKILL, targeting the pid of the current process."
            }},
        ]
    }

    constructor(props){
        super(props)
        this.addEventListener('ready', () => {
            if(!this.data){
                if(!this.props.action){
                    this.props = {action: prompt('I need a bash command to execute:')}
                    this.header = this.props.action
                }
                this.subscribeToShell(this.props.action)
            }

        })
    }
    
    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))
                         && this.dispatchEvent(new Event('ready'))
    }

    disconnectedCallback(){
        // this only fires if a shellout node was explicitely removed from the DOM tree
        // this DOES NOT FIRE when a user navigates away from the page 
        if(this.props.pid && !this.props['exit-code'] && !this.props['exit-signal']){
            this.sendSig("KILL")
        }       
    }

    get workingDirectory(){
        return this.getAttribute('cwd') || location.pathname
    }

    static get observedAttributes() {
        // possible object properties you expect spiders to return
        // don't forget attributes will always be coerced to lowercase
        return [
            'pid',
            'eval',
            'next',
            'bash',
            'timeout',
            'newsibling',
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
                this.child['data-' + attr].textContent += newValue;
                this.data += newValue;   
                break;
            case 'next':
                // this will need to parse chatbot response and set a timeout that's cancelled on submit...
                // var time = parseInt(newValue)
                // for now let's just immediately submit chat response so chatscript can trigger programs for us
                this.shadowParent.appendMessage(this.shadowParent.botShellout(newValue))
                break;
            case 'bash':
                this.shadowParent.appendMessage(this.shadowParent.bashShellout(newValue))
                break;
            case 'eval':
                eval(newValue);
                break;
            case 'newsibling':
                // this should be an object that includes, src, action, become, etc
                this.shadowParent.insertSibling(new ProtoBlock(JSON.parse(newValue))); 
                break;
            case 'become':
                // hmmm make sure that I have the attributes I need before becoming the new thing 
                if(this.shell.readyState == 0) this.become(newValue) //readyState set on load in protoblock
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

    sendSig(signal){
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
        this.data += command + '\n'
        
        fetch('/?' + encodeURIComponent(command), {
            method: 'POST', 
            credentials: 'same-origin',            
            headers: { "x-for-pid": this.props.pid }
        })
    }

    subscribeToShell(command){
        console.log("SUBSCRIBE")
        console.log(this.workingDirectory + '?' + encodeURIComponent(command) ,)
        this.shell = new EventSource(this.workingDirectory + '?' + encodeURIComponent(command) , {
            credentials: "same-origin"
        })

        this.shell.addEventListener('message', event => {
            // at the very least each message (event.data) will looks like 
            // {pid: 123}
            // {stdout: some output from a program}
            // {exit-code: 0}
            this.props = JSON.parse(event.data)
            // every JSON property received updates the HTML attribute of the same name
            // setting off any attached attribute observers
        })
    }
}  