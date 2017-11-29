class ShelloutBlock extends ProtoBlock {
    /* If you create a Shellout with an action, that action will be executed directly */
    /* If you create a Shellout with an "interpret", that string will be base64 encoded 
       and submitted to the interpret spider to get a response from chatbot */
    /* The messages received from the server could be stdout from a shell command, or 
       JSON returned by a spider program. Any properties of that JSON will be set as
       attribute of this, and observedAttributes lists some special values associated with actions  */

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
            if(this.props.interpret){
                // if interpret attribute is set, we're going to hit the interpret spider to connect to chatbot
                // encode message as base64 so that special characters aren't interpreted by the shell, decode and pipe result to stdin of interpret
                // this also takes care of unicode and emojis and other things that might confuse bash 
                var encodedInput = btoa(JSON.stringify(this.props.interpret))                
                this.props = {
                    header: this.props.interpret,
                    action: `printf ${encodedInput} | base64 --decode | node interpret`, 
                    cwd: '/spiders/basic/'
                }
            } else if(this.props.action){
                // this.header was set in proto constructor, don't need do anything
            } else {
                throw new Error("Don't instantiate ShellOut without an action or interpret attribute")
            }

            this.subscribeToShell(this.props.action)
        })
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
                break
            case 'exit-signal':
            case 'exit-code':
                this.shell.close()
                this.dispatchEvent(new Event('load')) // done loading
                break
            case 'bash':
                this.insertSibling(new ShelloutBlock({action: newValue}))
                break
            case 'newsibling':
                // this should be an object that includes, src, action, become, etc
                // this inserts a sibling to the whole convo block, not a sibling of the message
                this.shadowParent.insertSibling(new ProtoBlock(JSON.parse(newValue)));
                break
            case 'eval':
                // before evalling, check for a timeout
                this.checkForTimeOutAndThen(()=> eval(newValue))
            case 'become':
                // become is going to need all the attributes to be done loading, because its going to destroy and replace this DOM node
                // so check if its done, and if not, set a listener to run once it is done. checkForTimeout does this, tho I don't expect 'become' messages to include a timeout, why would you want to wait before converting? but you can.
                this.checkForTimeOutAndThen(()=> this.become(newValue))
                break;
            case 'next':
                // next attribute will submit a new message either instantly or after timeout expires
                // in the future there should be some attribute on the convoblock about when the last submission was and cancel this submission if bot is interrupted
                this.checkForTimeOutAndThen(() => this.insertSibling(new ShelloutBlock({interpret: newValue})))
                break
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

    checkForTimeOutAndThen(func){
        if(this.shell.readyState == 0){
            setTimeout(()=> func, parseInt(this.props.timeout) || 0)
        } else {
            this.addEventListener('load', () => {
                setTimeout(()=> func, parseInt(this.props.timeout) || 0)
            })
        }
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
        
        // "echo" the input to the stdout, appending it to the current textarea
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
            // assigning each message to props will set the attribute with they same key:value pair
        })
    }
}  