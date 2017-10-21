class SpringBlock extends ProtoBlock {
    constructor(){
        super()
        this.addEventListener('init', () => {

        })
    }

    subscribeToShell(command){
        let spring = new EventSource('/?' + command, {credentials: "same-origin"})
        spring.addEventListener('stdout', event => {
            console.log("stdout", event.data)
        })
        spring.addEventListener('code', event => {
            console.log("CODE", event.data)
            spring.close()
        })
        spring.addEventListener('signal', event => {
            console.log("signal", event.data)
            spring.close()
        })

    }
}  