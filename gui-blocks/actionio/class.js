class ActionioBlock extends ProtoBlock {
    /* The messages received from the server could be stdout from a shell command, or 
       JSON returned by a spider program. Any properties of that JSON will be set as
       attribute of this, and observedAttributes lists some special values associated with actions  */
    constructor(props){super(props)}

    static get actions(){
        return [
            {"Send Signal":{
                func: this.prototype.sendSig,
                args: [{select: ["HUP","INT","QUIT","ABRT","KILL","ALRM","TERM","CONT","STOP"]}],
                default: [() => "KILL"],
                info: "If the process has not exited on its own, this sends the selected signal to PKILL, targeting the pid of the current process."
            }}
        ]
    }

    static get reactions(){
        return [
            {
                watch: ["exit-code","exit-signal","error"],
                react: function(){
                    this.shell.close()
                    this.readyState = 'complete'
                }
            },
            {
                watch: ['stdout','stderr','error'],
                react: function(attributeName, oldValue, newValue){
                    this.child["data-" + attributeName].textContent += newValue
                    console.error(errorMsg)
                    console.error("EventSource connection closed by remote host, disconnecting")
                }
            },
            {
                watch: ["query","src"],
                react: function(attributeName, oldValue, newValue){
                    switch(this.props.target){
                        // if mode is continuous 
                        case 'beforebegin':
                        case 'beforeend':
                        case 'afterbegin':
                        case 'afterend':
                            this.shadowParent.insertAdjacentElement(this.props.target, new this.constructor({
                                action: this.props.action,
                                query: this.props.query
                            }))
                        case 'parent':
                            this.subscribeToShell.call(this.shadowParent)
                        case 'self': /* self is default, but can be set explicitly if you want */
                        default:
                            // create new one and replace this with it instead
                            this.replaceWith(new this.constructor({
                                action: this.props.action,
                                query: this.props.query
                            }))
                    }
                }
            }
        ]
    }



    subscribeToShell(){
        // optional extant shell allows a newly minted block via become gets all the event listeners reattached
        // if(optExtantShell) getEventListeners(optExtantShell).forEach(func func.removeEventListeners....)
        var pathname = this.props.action || ''
        var querystring = '?args=' + encodeURIComponent(this.props.query)
        
        this.shell = new EventSource(pathname + querystring, { withCredentials: true })
        this.constructor.observedAttributes.forEach(attr => {
            this.shell.addEventListener(attr, event => {
                console.log(event)
                this.setAttribute(attr, event.data)
            })
        })
    }

    
    static build(){
        if(!this.props.action) this.props.action = 'bash' // if not instantiated with an action, default to bash
        console.log("I look like", this)
        this.child['form'].addEventListener('submit', event => {
            this.props.query = this.child['input'].value // trigger query attribute observer
            this.child['input'].value = '' // reset input to blank
        })
    }

    static destroy(){
        console.log("actionio destroyed")
        // this.sendSig('KILL')
    }

    sendSig(signal){
        if(this.props['exit-code'] || this.props['exit-signal']) return this.errMsg = this.props.action + 'was already finished'
        /* I have to figure out why the pid represents the shell on linux, but the process itself on darwin */
        /* anyway, I have to kill 'the parent of pid', or if that fails, try 'kill the pid' */
        fetch(`/?pkill -${signal} -P ${this.props.pid} || kill -${signal} ${this.props.pid}`,{
            method: 'POST',
            credentials: 'same-origin'
        })
    }

}