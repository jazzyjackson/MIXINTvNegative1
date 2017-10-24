class DirectoryBlock extends ProtoBlock {
    constructor(){
        super()
        this.addEventListener('init', () => {
            this.header = this.shadowRoot.querySelector('header')
            this.fileList = this.shadowRoot.querySelector('file-list')

            this.listFunc = (pathname) => `${pathname}?ls -ap1` /* a: list all (. and ..), p: append '/' to directory, 1: 1 file per line */
            this.statFunc = (pathname,filename) => `${pathname}?node -e "console.log(JSON.stringify(require('fs').statSync('${filename}')))"`
            
            /* if src attribute wasn't set before being connected, set it as the current src */
            this.props.src || this.setAttribute('src', location.pathname)
            this.fetchDirectory(this.props.src)
                .then(listText => this.generateIcons(listText))
        })
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))
    }

    fetchDirectory(pathname){ 
        this.header.textContent = '...'      
        this.props = {lastUpdate: Date.now()} 
        return fetch(this.listFunc(pathname), {
            method: 'post',
            credentials: 'same-origin',
            redirect: 'error'
        })
        .then(response => {
            this.header.textContent = response.url.split('?')[0].slice(location.origin.length)
            return response
        })
        .then(response => response.text())
    }

    fetchStat(pathname, filename){
        return fetch(this.statFunc(pathname, filename), {
            method: 'post',
            credentials: 'same-origin',
            redirect: 'error'
        })
        .then(response => response.json())
    }

    makeMarkup(props){
        return `<file-block tabindex=0 filetype="${props.type}" title="${props.name}">
                    <file-details></file-details>
                    <file-name>${props.name}</file-name>
                </file-block>`
    }

    makeDateString(zulutime){
        let dateObj = new Date(zulutime)
        return dateObj.toLocaleTimeString() + ' ' + dateObj.toDateString() 
    }

    generateIcons(listText){
        let folders = listText.split('\n')
            .filter(name => name.slice(-1) == '/') // filter out anything thats not a directory
            .map(name => this.makeMarkup({type: "directory", name: name.slice(0,-1)}))

        let files = listText.split('\n')
            .filter(name => name && name.slice(-1) != '/') // filter out directories and empty lines
            .map(name => this.makeMarkup({type: "file", name: name}))
        
        // setting text of HTML creates subtree
        this.fileList.innerHTML = folders.concat(files).join('\n')
        // and then I attach event listeners to all the nodes that exist all of a sudden
        Array.from(this.fileList.querySelectorAll('file-block'), node => {
            node.details = node.querySelector('file-details')
            /* dblclick doesn't register for iphone, and focus will shift position in the middle of a dblclick */
            /* so I think I'll have to move the 'focus' css to a cusotm attribute, and determine whether to apply  */
            /* that attribute on click (so, with a delay in anticipation of a double click), using a timeout mechanism */
            node.addEventListener('focus', () => {
                this.fillFileDetail(node)
            })
            node.addEventListener('dblclick', () => {
                this.openFileFrom(node)
            })
            node.addEventListener('keydown', event => {
                if(event.key == 'Enter'){
                    this.openFileFrom(node)
                }
            })
        })
    }

    fillFileDetail(node){
        if(node.details.textContent) return null // already been done
        this.fetchStat(this.props.src, node.getAttribute('title'))
        .then(stat => {
            node.details.innerHTML += `
                <data-mode>${this.octal2symbol(stat.mode)}</data-mode>
                <data-atime>${this.makeDateString(stat.atime)}</data-atime>
                <data-mtime>${this.makeDateString(stat.mtime)}</data-mtime>
                <data-size>${stat.size}</data-size>
            `
        })
    }

    openFileFrom(node){
        document.getSelection().empty() // doubleclicking shouldn't select text. maybe this breaks expected behavior, but you can still select and click and drag            
        switch(node.getAttribute('filetype')){
            case 'file': 
                var newSibling = new TextareaBlock
                newSibling.props = {
                    src: this.props.src + node.getAttribute('title')
                }
                this.insertSibling(newSibling)
                break
            case 'directory':
                var newSibling = new DirectoryBlock
                newSibling.props = {
                    src: this.props.src + node.getAttribute('title') + '/'
                }
                this.insertSibling(newSibling)
                break
            case 'image':
            case 'audio':
            case 'video':
            case '3d':
        }
    }

    octal2symbol(filestat){
        let zeropad = binaryString => binaryString.length < 3 ? zeropad("0" + binaryString) : binaryString
        // filestat looks like 33279, returned by node's fs.stat
        let octalArray = filestat.toString(8).split('').slice(-3)
        // octalArray is in the form chmod likes, ['7','7','7']
        let binaryArray = octalArray.map((octal, index) => zeropad(parseInt(octal).toString(2)))
                                    .join('').split('')
        // goes from ['7','5','1'] 
        //        to ['111', '101', '1'] with parseInt().toString(2)
        //        to ['111','101','001'] via zeropad
        //        to '111101001' via join('')
        //        to ['1','1','1','1','0','1','0','0','1'] via split('')
        let symbolMask = 'rwxrwxrwx'.split('')
        return binaryArray.map((flag, index) => parseInt(flag) ? symbolMask[index] : '-').join('')
    }
}