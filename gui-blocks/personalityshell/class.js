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
            // since I'm feeding this to interpret via bash, I probably need to base64 it to exclude control characters
            let encodedInput = btoa(JSON.stringify(this.input.value))
            let shellout = new ShelloutBlock({
                name: this.input.value,
                action: `printf ${encodedInput} | base64 --decode | node interpret`, 
                autofocus: false, 
                cwd: '/spiders/'
            })
            this.convoBody.insertBefore(shellout, this.convoForm)
            this.input.value = ''
            this.input.focus()
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