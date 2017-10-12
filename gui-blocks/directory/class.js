class DirectoryBlock extends ProtoBlock {
    constructor(){
        super()
    }

    connectedCallback(){
        if(this.hasntBeenInitializedYet()){
            this.header = this.shadowRoot.querySelector('header')
            this.fileList = this.shadowRoot.querySelector('file-list')
            this.fileList.setAttribute('mode', 'icon' || 'detail' ) /* switch these to change default display mode */
            /* if src attribute wasn't set before being connected, set it as the current src */
            this.getAttribute('src') || this.setAttribute('src', location.pathname)
            this.header.textContent = this.props.src
            if(!this.props.lastUpdate) this.fetchDirectory()
        }
    }

    fetchDirectory(){
        this.props = {lastUpdate: Date.now()} 
        fetch(this.props.src + '?' + 'ls --all --format=verbose --group-directories-first --human-readable --time-style=long-iso', {
            method: 'post',
            credentials: 'same-origin',
            redirect: 'error'
        })
        .then(response => response.text())
        .then(ls_output => {
            let lines = ls_output.split('\n')
            this.props = {size: lines[0]}
            lines.slice(1).forEach(line => {
                if(!line) return line /* skip if line is blank */
                let columns = line.split(/\s+/)
                let directoryFlag = columns[0].charAt(0) == 'd'
                let fileObject = {
                    /* columns[0] will be something like drwxrwxrwx for [directory][owner][group][other/world] */                    
                    "owner-rxw": columns[0].slice(1,4),
                    "group-rxw": columns[0].slice(4,7),
                    "world-rxw": columns[0].slice(7,10),
                    /* columns[1] is the number of links to a file which I don't really care about, is there a way to suppress it? */
                    author: columns[2],
                    group: columns[3],
                    size: columns[4], /* not that directories are minimum block size, 512 bytes */
                    date: columns[5],
                    time: columns[6], 
                    name: columns.slice(7).join(' ') /* note there may be spaces in filename, so its 'the rest' of the columns */  
                }
                let newBlock = document.createElement('file-block') /* no custom element registered here, just an unknown element, likewise all the children, custom names to apply styles to */      
                newBlock.setAttribute('is-dir', directoryFlag)
                newBlock.setAttribute('tabIndex', 0)
                let titleText = `${fileObject.name}\nmodified: ${fileObject.date} ${fileObject.time}\nsize: ${fileObject.size}`
                newBlock.setAttribute('title', titleText)
                for(var key in fileObject){
                    let fileDatum = document.createElement('file-' + key)
                    fileDatum.textContent = fileObject[key]
                    newBlock.appendChild(fileDatum)
                }
                this.fileList.appendChild(newBlock)
                newBlock.addEventListener('dblclick', event => {
                    console.log(event)
                    console.log("NEW DIR", event.target.textContent)
                    
                    let currentPath = this.props.src
                    let newDirectory = event.target.textContent
                    let newPath = newDirectory == '..' ? currentPath.split('/').slice(0,-2).join('/') + '/' :
                                    newDirectory == '.'  ? currentPath                                      :
                                    currentPath + newDirectory + (directoryFlag ? '/' : '')                 ;
                    if(directoryFlag){
                        this.replaceWithNewBlock('directory-block', {src: newPath})
                    } else {
                        this.appendNewBlock('textarea-block', {src: newPath})
                    }
                })
   
            })
        })
    }

    replaceWithNewBlock(blockType, props){
        console.log(arguments)
        let newBlock = document.createElement(blockType)
        newBlock.props = props
        console.log(newBlock)
        this.replaceWith(newBlock)
    }

    appendNewBlock(blockType, props){
        console.log(arguments)
        let newBlock = document.createElement(blockType)
        newBlock.props = props
        console.log(newBlock);
        /* not sure if I can assume the parent node is a shadowroot, so, try both and append to whatever exists */
        (this.parentElement || this.getRootNode()).appendChild(newBlock)
    }
}