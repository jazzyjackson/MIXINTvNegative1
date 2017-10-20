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
        console.log('defaultFig', defaultFig.blocks.concat(defaultFig.frames)) 
        let possibleBlocks = defaultFig.blocks.concat(defaultFig.frames).map(classname => classname + '-block')      
        console.log("Available", possibleBlocks)
        let blockList = document.createElement('ul')
        possibleBlocks.forEach(block => {
            let blockListItem = document.createElement('li')
            blockListItem.setAttribute('block-name', block)
            blockListItem.textContent = block.split('-')[0]
            blockListItem.addEventListener('click', event => {
                let enclosedElement = block
                console.log("replacing become with", block)
                this.replaceWith(document.createElement(enclosedElement))
            })
            blockList.appendChild(blockListItem)
        })
        this.shadowRoot.querySelector('block-list').appendChild(blockList)
    }
}