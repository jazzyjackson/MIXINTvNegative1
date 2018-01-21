class BecomeBlock extends ProtoBlock {
    constructor(props){
        super(props)
    }

    static ready(){

        let blockList = document.createElement('ul')
        this.constructor.becomeable.forEach(block => {
            console.log("possible", block)
            let blockListItem = this.createElementFromObject({"li":{
                "block-name": block + '-block',
                "tabIndex": 0,
                "textContent": block
            }})

            let becomeFunc = event => {
                if(event.type == 'keydown' && event.key != 'Enter') return null // ignore nonEnter key events
                event.preventDefault() // solve mystery bug where if this node gets replaced with something that has a form, the keydown fires the submit as soon as it comes into existance, so yeah, prevent that
                let enclosedElement = event.target.getAttribute('block-name')
                console.log("replace with", block)
                
                this.replaceWith(document.createElement(enclosedElement))
            }

            blockListItem.addEventListener('click', becomeFunc)
            blockListItem.addEventListener('keydown', becomeFunc)
            blockList.appendChild(blockListItem)
        })
        
        this.child['block-list'].appendChild(blockList)
    }
}