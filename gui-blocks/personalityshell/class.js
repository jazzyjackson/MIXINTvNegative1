class PersonalityshellBlock extends ConvoshellBlock {
    
    constructor(props){
        super(props)
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))
    }

    // overwriting the handleSubmit function in ConvoShell
    handleSubmit(event){
        event.preventDefault()
        if(this.getAttribute('mode') == 'party'){
            // fetch POST message, disable submit until POST is finished
        } else {
            var encodedInput = btoa(JSON.stringify(this.input.value))            
            // since I'm feeding this to interpret via bash, I probably need to base64 it to exclude control characters
            let shellout = new ShelloutBlock({
                header: this.input.value,
                action: this.input.value,
                autofocus: false, 
            })

            this.convoBody.insertBefore(shellout, this.convoForm)
            this.input.value = ''
            this.input.focus()

            // if the shellout finished with an error,
            // replace it with a newer, better, shellout,
            // instead passing the same input to spiders/interpret.js
            shellout.addEventListener('load', () => {
                if(shellout.props['exit-code'] != 0){
                    var errmsg = shellout.props.stderr
                    // somehow I'd like to pass this err back to chatscript, OOB, so chatscript can tell me what went wrong
                    var personalityOut = new ShelloutBlock({
                        header: shellout.props.header,
                        action: `printf ${encodedInput} | base64 --decode | node interpret`, 
                        autofocus: false, 
                        cwd: '/spiders/'
                    })
                    shellout.replaceWith(personalityOut)
                    console.log("shell", shellout)
                    console.log("person", personalityOut)
                }
            })
        }
    }

    handleParty(){

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