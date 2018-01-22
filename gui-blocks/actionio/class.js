class ActionioBlock extends ProtoBlock {
    /* The messages received from the server could be stdout from a shell command, or 
       JSON returned by a spider program. Any properties of that JSON will be set as
       attribute of this, and observedAttributes lists some special values associated with actions  */
    constructor(props){
        super(props)
    }

    static ready(){
        this.child['form'].addEventListener('submit', this.handleSubmit.bind(this))
    }

    // allowed to be overwritten by descendants of actionio
    handleSubmit(event){
        event.preventDefault()
        let query = this.child['input'].value

        switch(this.props.interaction){
            case 'introvert':
                this.setAttribute('query', query); break;
            case 'extravert': // extravert is default behavior
            default:
                var position = this.props.target || 'afterend'
                var element = new ActionioBlock({
                    action: this.props.action, 
                    query: query
                })
                this.insertAdjacentElement(position, element)
        }

        // assign value of input to query, which will trigger the query reaction
        // disable until the first bytes come back from event source - triggered by reaction observer on 'query' attr
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

    static get actions(){
        return [
            {"send signal": {
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
                observe: ["exit-code","exit-signal","error"],
                respond: function(){
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
                observe: ["query"],
                respond: function(newValue){
                    switch(this.props.mode){
                        // if mode is continuous 
                        case 'continuous':
                            this.props.pid && this.sendStdin(newValue)
                            break
                        case 'discrete': // 'discrete' is default behavior, don't allow multiple queiries on element
                        default:
                            this.props.pid && this.sendSig('KILL')
                            this.subscribeToShell(newValue)
                    }
                }
            }
        ]
    }

    subscribeToShell(bashObject){
        console.log('new shell:',bashObject)
        // in continuous mode, existing PID will trigger a POST to send text to 'stdin' of ongoing process, or throw error if process is finished
        // in discrete mode, existing PID will be trigger a kill message, existing shell will be closed, and replaced with a new one.
        this.child['input'].setAttribute('disabled', '') // set disabled boolean attribute
        this.addEventListener('readyStateChange', () => {
            this.child['input'].value = ''
            this.child['input'].removeAttribute('disabled') // remove boolean attribute
            this.child['input'].focus()
        }, {once: true})
        /*  
         * bashObject should look like {"args":"ls -ap1"}, which will just be fork -> (sh, [-c, 'ls -ap1'])
         *  or you could do {"exec":"ls", "args":"-ap1"} which will fork -> (ls, ['-ap1'])
         *  or {"src":"someScript.sh", "args":"string data"} -> (sh, ['someScript.sh','string data'])
         * 
         * * * * * */
        this.shell = new EventSource(this.props.action + '?' + this.props.query, { withCredentials: true })
        
        // this will only react to stdout, stderr, and error messages from the source.
        let expectedMessages = ['stdout','stderr','exit-code','exit-signal','pid']
        expectedMessages.forEach(attr => {
            this.shell.addEventListener(attr, event => {
                this.readyState = 'interactive' // change readyState after the first byte is received.
                // else use the encoded version for domstring, can be decoded on attributechangedcallback
                this.setAttribute(attr, event.data)
            })
        })

        this.shell.addEventListener('error', err => {
            console.error(err)
            this.setAttribute('error', err)
        })
    }
}