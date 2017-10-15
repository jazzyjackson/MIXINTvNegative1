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
        let possibleBlocks = Array.from(document.querySelectorAll('template'), template => {
            return template.getAttribute('renders')
        })
        let impossibleBlocks = Array.from(document.querySelectorAll('build-error'), error => {
            /* I assume path attribute for error looks like gui-blocks/proto/template.html */
            /* so .split('/')[1] should return proto, and I append '-block'                */
            return error.getAttribute('path').split('/')[1] + '-block'
        })
        impossibleBlocks.push('proto-block','become-block') /* there ought to be an option to hide certain blocks by name, doesnt really matter if they're loaded or not, just filter them out. somewhere in the fig file? */
        let availableBlocks = possibleBlocks.filter(block => !impossibleBlocks.includes(block))
        console.log("Available", availableBlocks)
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