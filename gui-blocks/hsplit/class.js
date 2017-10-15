class HsplitBlock extends MultiplexBlock {
    constructor(){
        super()
    }

    connectedCallback(initializing){
        if(initializing || this.hasntBeenInitializedYet()){
        }
    }


    reCalculateChildren(){
        console.log("recalc")
        let width = 100 / parseInt(this.getAttribute('show-max'))
        let start = parseInt(this.getAttribute('show-start'))
        Array.from(this.shadowRoot.children, (child, nth) => {
            child.style.width = `${width}%`
            child.style.left = `${width * (nth - start)}%`
        })
    }


}