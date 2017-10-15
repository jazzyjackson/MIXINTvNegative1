class VsplitBlock extends MultiplexBlock {
    constructor(){
        super()
    }

    connectedCallback(initializing){
        console.log("VSPLIT INIT", initializing)
        if(initializing || this.hasntBeenInitializedYet()){
            console.log("VSPLIT GOING")
        }
    }


    reCalculateChildren(){
        console.log("recalc")
        let height = 100 / parseInt(this.getAttribute('show-max'))
        let start = parseInt(this.getAttribute('show-start'))
        Array.from(this.shadowRoot.children, (child, nth) => {
            child.style.height = `${height}%`
            child.style.top = `${height * (nth - start)}%`
        })
    }


}