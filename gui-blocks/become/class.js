class BecomeBlock extends ProtoBlock {
    constructor(){
        super()
    }

    async connectedCallback(){
        if(this.hasntBeenInitializedYet()){
            // most blocks can initialize themselves right away,
            // but become-block is going to list all possible blocks,
            // so it should wait until the document is done loading 
            await this.waitForDOM()
            this.buildBlockList()
        }
    }

    buildBlockList(){               
        let possibleBlocks = Array.from(document.querySelectorAll('template'), template => {
            return template.getAttribute('renders')
        })
        let impossibleBlocks = Array.from(document.querySelectorAll('build-error'), error => {
            /* I assume path attribute for error looks like gui-blocks/proto/template.html */
            /* so .split('/')[1] should return proto, and I append '-block'                */
            return error.getAttribute('path').split('/')[1] + '-block'
        })
        impossibleBlocks.push('proto-block','become-block')
        let availableBlocks = possibleBlocks.filter(block => !impossibleBlocks.includes(block))
        console.log("Available", availableBlocks)
        let blockList = document.createElement('ul')
        availableBlocks.forEach(block => {
            let blockListItem = document.createElement('li')
            blockListItem.setAttribute('block-name', block)
            blockListItem.textContent = block.split('-')[0]
            blockListItem.addEventListener('click', event => {
                let enclosedElement = block
                this.replaceWith(document.createElement(enclosedElement))
            })
            blockList.appendChild(blockListItem)
        })
        this.shadowRoot.querySelector('block-list').appendChild(blockList)
    }
}