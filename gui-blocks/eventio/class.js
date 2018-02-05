class EventioBlock extends ProtoBlock {
    /* The messages received from the server could be stdout from a shell command, or 
       JSON returned by a spider program. Any properties of that JSON will be set as
       attribute of this, and observedAttributes lists some special values associated with actions  */
    constructor(props){super(props)}

    static get actions(){
        return [
            {
                name: "Send Signal",
                func: this.prototype.sendSig,
                args: [{select: ["HUP","INT","QUIT","ABRT","KILL","ALRM","TERM","CONT","STOP"]}],
                default: [() => "KILL"],
                info: "If the process has not exited on its own, this sends the selected signal to PKILL, targeting the pid of the current process."
            }
        ]
    }

    static get reactions(){
        return [
            {
                watch: ["exit-code","exit-signal","error"],
                react: function(){
                    this.dispatchEvent(new Event('load')) // also sets this.readyState = 'complete', fires readyStateChange
                    this.shell.close()
                }
            },
            {
                observe: ['error'],
                respond: function(errorMsg){
                    console.error(errorMsg)
                    console.error("EventSource connection closed by remote host, disconnecting")
                }
            },
            {
                observe: ["stdout"],
                respond: function(newValue){
                    this.child["data-stdout"].textContent += this.tryJSON(newValue) || newValue
                }
            },
            {
                observe: ["stderr"],
                respond: function(newValue){
                    this.child["data-stderr"].textContent += this.tryJSON(newValue) || newValue
                }
            },
            {
                observe: ["query","src"],
                respond: function(newValue){
                    switch(this.props.target){
                        // if mode is continuous 
                        case 'beforebegin':
                        case 'beforeend':
                        case 'afterbegin':
                        case 'afterend':
                            let adjacentElement = new this.constructor({
                                action: this.props.action,
                                query: this.props.query
                            })
                            this.shadowParent.insertAdjacentElement(this.props.target, adjacentElement)
                        case 'parent':
                            this.subscribeToShell.call(this.shadowParent)
                        case 'self': /* self is default, but can be set explicitly if you want */
                        default:
                            this.subscribeToShell.call(this)
                    }
                }
            }
        ]
    }



    subscribeToShell(bashObject){
        this.shell.addEventListener('error', err => {
            console.error(err)
            this.setAttribute('error', err)
        })
    }

    
    static build(){
        this.child['form'].addEventListener('submit', event => {
            this.props.query = this.child['input'].value // trigger query attribute observer
            this.child['input'].value = '' // reset input to blank
        })
    }

    static destroy(){
        this.sendSig('KILL')
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