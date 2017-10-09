class BecomeBlock extends ProtoBlock {
    constructor(){
        super()
    }

    connectedCallback(){
        this.init()
        let possibleBlocks = Array.from(document.querySelectorAll('template'), template => {
            return template.getAttribute('renders')
        })
        let impossibleBlocks = Array.from(document.querySelectorAll('build-error'), error => {
            /* I assume path attribute for error looks like gui-blocks/proto/template.html */
            /* so .split('/')[1] should return proto, and I append '-block'                */
            return error.getAttribute('path').split('/')[1] + '-block'
        })
        let availableBlocks = possibleBlocks.filter(block => !impossibleBlocks.includes(block))
        console.log("AVAILABLE BLOCKS", availableBlocks)
    }
}