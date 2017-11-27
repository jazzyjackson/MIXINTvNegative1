class PersonalityshellBlock extends ConvoshellBlock {
    
    constructor(props){
        super(props)
        this.addEventListener('ready', () => {
            this.convoRestart()
        })
    }

    bashShellout(action){
        return new ShelloutBlock({
            header: action,
            action: action,
            autofocus: false, 
        })
    }
        
    botShellout(action){
        // JSON.stringify isn't just for objects. Handles escaping special characeters
        // and wraps it in quotes so that it's valid format for btoa base64 encoding
        var encodedInput = btoa(JSON.stringify(action))
        return new ShelloutBlock({
            header: action,
            action: `printf ${encodedInput} | base64 --decode | node interpret`, 
            autofocus: false, 
            cwd: '/spiders/basic/'
        })
    }

    appendMessage(node){
        this.child['convo-body'].insertBefore(node, this.child['convo-form'])        
    }

    // overwriting the handleSubmit function in ConvoShell
    handleSubmit(event){
        event.preventDefault()
        if(!this.child['input'].value.trim()){
            // if input was empty, replace it with ellipses cuz empty input is interpretted as start of new converstaion
            this.child['input'].value = '...'
        }
        var action = this.child['input'].value
        if(this.props.interpret == 'bashFirst'){
            let bashOut = this.bashShellout(action)
            this.appendMessage(bashOut)
            bashOut.addEventListener('load', () => {
                // if exit code is truthy (non-zero) ask the bot what to do (but by the way the props are strings so parseInt)
                if(Boolean(parseInt(bashOut.props['exit-code']))){
                    var errmsg = bashOut.props.stderr // somehow I'd like to pass this err back to chatscript, OOB, so chatscript can tell me what went wrong
                    bashOut.replaceWith(this.botShellout(action))
                }
            })
        } else {
            let personalityOut = this.botShellout(action)
            this.appendMessage(personalityOut)
        }
        this.child['input'].value = ''
    }

    chatscriptStart(){
        this.appendMessage(this.bashShellout('make bootchatscript'))
    }

    convoRestart(){
        Array.from(this.child['convo-body'].querySelectorAll('shellout-block'), child => child.remove())
        let firstMessage = this.botShellout(this.props.init || '')
        firstMessage.classList.add("hideHeader")
        this.appendMessage(firstMessage)
    }

    rebuild(){
        this.appendMessage(this.bashShellout('make buildbot'))        
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