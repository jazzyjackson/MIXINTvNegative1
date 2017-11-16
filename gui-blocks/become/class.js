class BecomeBlock extends ProtoBlock {
    constructor(props){
        super(props)
        this.addEventListener('init', () => {
            this.waitForDOM().then(()=>{
                this.buildBlockList()
            })
        })
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))
                         && this.dispatchEvent(new Event('ready'))
    }

    buildBlockList(){      
        let possibleBlocks = defaultFig.blocks.concat(defaultFig.frames).map(classname => classname + '-block')      
        let blockList = document.createElement('ul')
        possibleBlocks.forEach(block => {
            let blockListItem = document.createElement('li')
            blockListItem.setAttribute('block-name', block)
            blockListItem.setAttribute('tabIndex', 0)
            blockListItem.textContent = block.split('-')[0]
            let becomeFunc = event => {
                if(event.type == 'keydown' && event.key != 'Enter') return null // ignore nonEnter key events
                // that was surprising. this event... I don't know how it happened but 
                // I replaced becomeblock with an element with a form, where a focused the form on ready
                // and somehow this event right here fired off the submit callback on the form. But that element didn't exist on keydown, so yea I'm surprised
                event.preventDefault()
                let enclosedElement = block
                this.replaceWith(document.createElement(enclosedElement))
            }
            blockListItem.addEventListener('click', becomeFunc)
            blockListItem.addEventListener('keydown', becomeFunc)
            blockList.appendChild(blockListItem)
        })
        this.child['block-list'].appendChild(blockList)
    }
}