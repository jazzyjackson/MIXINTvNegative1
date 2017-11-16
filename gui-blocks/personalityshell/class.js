class PersonalityshellBlock extends ConvoshellBlock {
    
    constructor(props){
        super(props)
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))
                         && this.dispatchEvent(new Event('ready'))
    }

    // overwriting the handleSubmit function in ConvoShell
    handleSubmit(event){
        event.preventDefault()
        if(!this.input.value.trim()) this.input.value = '...'
        if(this.getAttribute('mode') == 'party'){
            // fetch POST message, disable submit until POST is finished
        } else {
            // primary shellout goes with 
            var encodedInput = btoa(JSON.stringify(this.input.value))            
            // since I'm feeding this to interpret via bash, I probably need to base64 it to exclude control characters
            let shellout = new ShelloutBlock({
                header: this.input.value,
                action: this.input.value,
                autofocus: false, 
            })

            this.convoBody.insertBefore(shellout, this.convoForm)
            this.input.value = ''
            // if the shellout finished with an error,
            // replace it with a newer, better, shellout,
            // instead passing the same input to spiders/interpret.js
            shellout.addEventListener('load', () => {
                // if exit code is truthy (non-zero) ask the bot what to do (but by the way the props are strings so parseInt)
                if(Boolean(parseInt(shellout.props['exit-code']))){
                    var errmsg = shellout.props.stderr
                    console.log("personality replaced this error:", errmsg)
                    // somehow I'd like to pass this err back to chatscript, OOB, so chatscript can tell me what went wrong
                    var personalityOut = new ShelloutBlock({
                        header: shellout.props.header,
                        action: `printf ${encodedInput} | base64 --decode | node interpret`, 
                        autofocus: false, 
                        cwd: '/spiders/'
                    })
                    shellout.replaceWith(personalityOut)
                }
            })
        }
    }

    handleParty(){

    }

    convoRest(){
        // send :reset or getAttribute('botinit')
    }

    static get actions(){
        return [
            // something like this
            // {"rebuild bot": {
            //     func: this.prototype.rebuild,
            //     args: [{select: ["harry","shelly"]}],
            //     default: [ctx => ctx.getAttribute('botname')],
            //     info: "If the bot is open to commands, you can send a :build command"
            // }},
            {"start over": {
                func: this.prototype.convoReset,
                info: "Sends a :reset command, or an init command if one exists"
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