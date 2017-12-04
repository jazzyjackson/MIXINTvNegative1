class PersonalityshellBlock extends ConvoshellBlock {
    
    constructor(props){
        super(props)
        this.addEventListener('ready', () => {
            this.convoRestart()
            /* 'nextTick' set focus after DOM gets painted */
            setTimeout(()=>this.child['input'].focus())
        })
    }

    appendMessage(node){
        this.child['convo-form'].insertAdjacentElement('beforebegin', node)        
    }

    // overwriting the handleSubmit function in ConvoShell
    handleSubmit(event){
        // don't actually submit the form, stay here
        event.preventDefault()
        // if input was empty, replace it with ellipses cuz empty input is interpretted as start of new converstaion
        var input = this.child['input'].value.trim() || '...'
        // and then zero out the input value
        this.child['input'].value = ''
        // there's an option (an attribute on personalityshell) to submit input first as a bash command,
        // and if the bash command throws an error, resu
        if(this.props.interpret == 'bashFirst'){
            var bashOut = new ShelloutBlock({
                args: input
            })
            // nothing happens until shelloutblock is appended to DOM
            this.appendMessage(bashOut)
            // once that process errors or exits, a load event is fired
            bashOut.addEventListener('load', () => {
                // if exit code is truthy (non-zero) ask the bot what to do 
                // (but by the way the props are strings so parseInt)
                if(Boolean(parseInt(bashOut.props['exit-code']))){
                    // TODO: somehow I'd like to pass this err back to chatscript, 
                    // OOB, so chatscript can tell me what went wrong
                    var errmsg = bashOut.props.stderr 
                    bashOut.replaceWith(new ShelloutBlock({
                        exec: 'spiders/basic/interpret.js', 
                        stdin: input,
                    }))
                }
            })
        } else {
        // but the default is not bashFirst (botFirst or undefined will end up here)
        // and we just send out input directly to the interpret process
            var personalityOut = new ShelloutBlock({
                exec: 'spiders/basic/interpret.js',
                stdin: input
            })
            this.appendMessage(personalityOut)
        }
        // after submit
    }

    chatscriptStart(){
        this.appendMessage(new ShelloutBlock({
            args: 'make bootchatscript'
        }))
    }

    convoRestart(initMessage = "introductions intro"){
        Array.from(this.child['convo-body'].children).filter(child => child.tagName != 'CONVO-FORM').map(child => child.remove())
        this.appendMessage(new ShelloutBlock({
            exec: 'spiders/basic/interpret.js',
            stdin: initMessage,
            hideHeader: true
        }))
    }

    rebuild(){
        this.appendMessage(new ShelloutBlock({
            args: 'make buildbot'
        }))        
    }

    static get actions(){
        return [
            {"rebuild bot": {
                func: this.prototype.rebuild,
                info: "If the bot is open to commands, you can send a :build command"
            }},
            {"restart convo": {
                func: this.prototype.convoRestart,
                info: "Sends a :reset command, or an init command if one exists"
            }},
            {"start ChatScript": {
                func: this.prototype.chatscriptStart,
                info: "Sends a command to the server to start ChatScript as a background process."
            }},
            {"set interpret mode": {
                func: HTMLElement.prototype.setAttribute,
                args: [{label: "interpret"},{select: ["botFirst","bashFirst"]}],
                default: [() => "interpret", ctx => {
                    return ctx.getAttribute("interpret") == "bashFirst" ? "botFirst" : "bashFirst"
                }]
            }}
        ]
    }

    /*
        overwrite the submit method to hit up interpret
        actions include:
            - tail user file for debugging
            - tail user logs
            (here's where you could write custom interfaces for these data streams too)
            (everything works better with fibonacciplexer)
    */
}