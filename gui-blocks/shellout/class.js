class ShelloutBlock extends ProtoBlock {
    /* If you create a Shellout with an action, that action will be executed directly */
    /* If you create a Shellout with an "interpret", that string will be base64 encoded 
       and submitted to the interpret spider to get a response from chatbot */
    /* The messages received from the server could be stdout from a shell command, or 
       JSON returned by a spider program. Any properties of that JSON will be set as
       attribute of this, and observedAttributes lists some special values associated with actions  */
    constructor(props){
        super(props)
        this.addEventListener('ready', () => {
            this.attachGlobalScript('/gui-blocks/showdown/assets/showdown.js').then(()=>{
                this.converter = new showdown.Converter
            })
            if(!this.header){
                this.header = this.props.stdin || this.props.args
            }
            this.subscribeToShell()
            this.child['form'].addEventListener('submit', event => {
                event.preventDefault()
                let paramforms = this.child['form'].querySelectorAll('param-form input')
                let args = Array.from(paramforms, parameter => {
                    let key = parameter.getAttribute('name')
                    let value = parameter.value
                    console.log("KEY", key)
                    console.log("VALUE", value)
                    return {[key]: value}
                }).reduce((a,b) => Object.assign(a,b), {})
                
                this.setAttribute('args', JSON.stringify(args))
                // next tick, cuz I want to read this.props.args
                // setTimeout(()=>{
                //     this.reinterpret()
                // })
                this.reinterpret()
            })
        })
    }
    static get actions(){
        return [
            {"send signal": {
                func: this.prototype.sendSig,
                args: [{select: ["HUP","INT","QUIT","ABRT","KILL","ALRM","TERM","CONT","STOP"]}],
                default: [() => "KILL"],
                info: "If the process has not exited on its own, this sends the selected signal to PKILL, targeting the pid of the current process."
            }},
            {"re-interpret": {
                func: this.prototype.reinterpret,
                info: "Replace with new instantiation"
            }}
            /*
            Form generated by required/optional attributes
            updates to form get pushed to arg attribute
            re-run tags arg attribute as arg
            src is already there !
            */
        ]
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
            'optional',
            'required',
            'help',
            'target-process'
        ]
    }

    makeStrongTagClickable(strongTag){
        strongTag.addEventListener('click', event => {
            this.insertAdjacentElement('afterend', new ShelloutBlock({
                exec: 'spiders/basic/interpret.js',                    
                stdin: strongTag.textContent,
            }))
            this.cancelStrongTags()
        })
    }

    cancelStrongTags(){
        this.child['data-stdout'].textContent = this.child['data-stdout'].textContent        
    }

    attributeChangedCallback(attr, oldValue, newValue) {
        switch(attr){
            // for either stderr, stdout, or err, append value to appropriate shell category, but also append to hidden textarea incase block is transformed or saved to disk. 
            case 'stdout':
            case 'stderr':
            case 'error':
                // if this shellout block was made to interpret a message from chatscript, 
                // assume output is markdown format and turn strong tags into auto-submit links
                if(this.props.exec && this.props.exec.includes('interpret')){
                    this.child['data-' + attr].innerHTML += this.converter.makeHtml(newValue) 
                    Array.from(this.child['data-' + attr].querySelectorAll('strong'), this.makeStrongTagClickable.bind(this))
                } else {
                    this.child['data-' + attr].textContent += newValue                                        
                }
                this.data += newValue
                break
            case 'exit-signal':
            case 'exit-code':
                this.shell.close()
                this.dispatchEvent(new Event('load')) // done loading
                break
            case 'bash':
                this.insertAdjacentElement('afterend', new ShelloutBlock({
                    args: newValue
                }))
                break
            case 'newsibling':
                // this should be an object that includes, src, action, become, etc
                // this inserts a sibling to the whole convo block, not a sibling of the message
                this.shadowParent.insertAdjacentElement('afterend', new ProtoBlock(JSON.parse(newValue)));
                break
            case 'eval':
                // before evalling, check for a timeout
                this.checkForTimeOutAndThen(()=> eval(newValue))
            case 'become':
                // become is going to need all the attributes to be done loading, because its going to destroy and replace this DOM node
                // so check if its done, and if not, set a listener to run once it is done. checkForTimeout does this, tho I don't expect 'become' messages to include a timeout, why would you want to wait before converting? but you can.
                this.checkForTimeOutAndThen(()=> this.become(newValue))
                break
            case 'next':
                // next attribute will submit a new message either instantly or after timeout expires
                // in the future there should be some attribute on the convoblock about when the last submission was and cancel this submission if bot is interrupted
                this.checkForTimeOutAndThen(() => {
                    this.insertAdjacentElement('afterend', new ShelloutBlock({
                        exec: 'spiders/basic/interpret.js',                    
                        stdin: newValue,
                        hideHeader: true
                    }))
                })
                break
            case 'required':
            case 'optional':
                this.generateParameterForm()
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
            setTimeout(func, parseInt(this.props.timeout) || 0)
        } else {
            this.addEventListener('load', () => {
                setTimeout(func, parseInt(this.props.timeout) || 0)
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

    get propsAsQuery(){
        var object = this.props
        return '?' + Object.keys(object)
                           .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(object[key])}`)
                           .join('&')
    }

    subscribeToShell(){
        this.shell = new EventSource(this.propsAsQuery, { withCredentials: true })

        this.shell.addEventListener('error', event => {
            console.log("EventSource connection closed by remote host, disconnecting")
            this.shell.close()
            // this.subscribeToShell()
            // try to reconnect with new target-process
        })

        this.constructor.observedAttributes.forEach(attr => {
            this.shell.addEventListener(attr, event => {
                console.log(event)
                let data = JSON.parse(event.data)
                if(typeof data != 'object'){
                    this.setAttribute(attr, data)
                } else {
                    // else use the encoded version for domstring, can be decoded on attributechangedcallback
                    this.setAttribute(attr, event.data)
                }
            })
        })
    }

    reinterpret(){
        this.replaceWith(new ShelloutBlock({
            exec: this.props.exec,
            header: this.props.header,
            args: this.props.args
        }))
    }

    generateParameterForm(){
        let requiredParams = this.props.required && JSON.parse(this.props.required) || {}
        let optionalParams = this.props.optional && JSON.parse(this.props.optional) || {}
        this.child['required-params'].innerHTML = ""
        this.child['optional-params'].innerHTML = ""
                
        
        Object.keys(requiredParams).map(key => {
            let param = requiredParams[key]
            this.child['required-params'].innerHTML += `
                <param-form>
                    <h4> ${key} </h4>
                    <input regex="${param.regex}" name="${key}" type='${param.type}' placeholder='${param.default || ''}'>
                    <h5> ${param.desc} </h5>
                </param-form>
            `
        })
        Object.keys(optionalParams).map(key => {
            let param = optionalParams[key]
            this.child['optional-params'].innerHTML += `
            <param-form>
                <h4> ${key} </h4>
                <input regex="${param.regex}" name="${key}" type='${param.type}' placeholder='${param.default || ''}'>
                <h5> ${param.desc} </h5>
            </param-form>
            `
        })
    }


}