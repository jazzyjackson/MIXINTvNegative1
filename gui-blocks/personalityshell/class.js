class PersonalityshellBlock extends ConvoshellBlock {
    
    constructor(props){
        super(props)
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))
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