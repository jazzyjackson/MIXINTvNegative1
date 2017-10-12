class DirectoryBlock extends ProtoBlock {
    constructor(){
        super()
    }

    connectedCallback(){
        if(this.hasntBeenInitializedYet()){
            this.header = this.shadowRoot.querySelector('header')
            this.fileList = this.shadowRoot.querySelector('file-list')
            this.fileList.setAttribute('mode', 'icon' || 'detail' ) /* switch these to change default display mode */
            /* if pathname attribute wasn't set before being connected, set it as the current pathname */
            this.getAttribute('pathname') || this.setAttribute('pathname', location.pathname)
            this.header.textContent = this.props.pathname
            if(!this.props.lastUpdate) this.fetchDirectory()
        }
    }

    fetchDirectory(){
        this.props = {lastUpdate: Date.now()} 
        fetch(this.props.pathname + '?' + 'ls --all --format=verbose --group-directories-first --human-readable --time-style=long-iso', {
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
                if(directoryFlag){
                    newBlock.addEventListener('dblclick', event => {
                        console.log(event)
                        let currentPath = this.props.pathname
                        let newDirectory = event.target.textContent
                        let newPath = newDirectory == '..' ? currentPath.split('/').slice(0,-2).join('/') + '/' :
                                      newDirectory == '.'  ? currentPath                                        :
                                      currentPath + newDirectory + '/'                                          ;
                        this.replaceWithNewDirectory(newPath)
                    })
                }
            })
        })
    }

    replaceWithNewDirectory(pathname){
        let newBlock = new DirectoryBlock
        newBlock.props = {pathname}
        this.replaceWith(newBlock)
    }
}