class BecomeBlock extends ProtoBlock {
    constructor(){
        super()
        this.addEventListener('init', () => {
            this.waitForDOM().then(()=>{
                this.buildBlockList()
            })
        })
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))                
    }

    buildBlockList(){      
        let possibleBlocks = defaultFig.blocks.concat(defaultFig.frames).map(classname => classname + '-block')      
        console.log("Available", possibleBlocks)
        let blockList = document.createElement('ul')
        possibleBlocks.forEach(block => {
            let blockListItem = document.createElement('li')
            blockListItem.setAttribute('block-name', block)
            blockListItem.setAttribute('tabIndex', 0)
            blockListItem.textContent = block.split('-')[0]
            let becomeFunc = event => {
                if(event.type == 'keydown' && event.key != 'Enter') return null // ignore nonEnter key events
                let enclosedElement = block
                this.replaceWith(document.createElement(enclosedElement))
            }
            blockListItem.addEventListener('click', becomeFunc)
            blockListItem.addEventListener('keydown', becomeFunc)
            blockList.appendChild(blockListItem)
        })
        this.shadowRoot.querySelector('block-list').appendChild(blockList)
    }
}