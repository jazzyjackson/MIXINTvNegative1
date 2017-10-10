class BecomeBlock extends ProtoBlock {
    constructor(){
        super()
    }

    connectedCallback(){
        this.init()

        this.addEventListener('init', () => {
            /* This is a little ugly, but it might be the case the this element is initialized before the window is done loading */
            /* and my build-errors element doesn't come in until the very end */
            /* so if build-errors isn't available yet (to tell me what blocks don't exist), wait til window load */
            if(!document.querySelector('build-errors')){
                window.addEventListener('load', () => {
                    this.buildBlockList()
                })
            } else {
                this.buildBlockList()
            }
        })
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