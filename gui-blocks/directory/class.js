class DirectoryBlock extends ProtoBlock {
    constructor(){
        super()
        this.addEventListener('init', () => {
            this.header = this.shadowRoot.querySelector('header')
            this.headerTitle = this.shadowRoot.querySelector('header-title')
            this.fileList = this.shadowRoot.querySelector('file-list')

            this.listFunc = (pathname) => `${pathname}?ls -ap1` /* a: list all (. and ..), p: append '/' to directory, 1: 1 file per line */
            this.statFunc = (pathname,filename) => `${pathname}?node -e "console.log(JSON.stringify(require('fs').statSync('${filename}')))"` // its really dumb to launch a node process to grab the file size and permissions but filesystem API is not consistent across systems so this is the best I got so far. I'm considering lstat with a switch for Darwin vs Linux, but don't know if that's a 90% measure or a 99% measure. Node is 100% cuz there's a bunch of code smoothing out platform differences but I still feel like there's a pretty easy to parse C API somewhere deep down
            
            /* if src attribute wasn't set before being connected, set it as the current src */
            this.props.src || this.setAttribute('src', location.pathname)
            this.fetchDirectory(this.props.src)
            .then(listText => this.generateIcons(listText))
        })
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))
    }

    get knownFormats(){
        return {
            table: ['csv','tsv'],
            image: ['jpeg','jpg','png','gif','bmp','svg'],
            audio: ['ogg','flac','acc','mp3','wave','wav'],
            video: ['webm','mp4','avi'],
            code: ['py','js','c','cs','top','html','css'],
            markdown: ['markdown','mdown','mkdn','md','mkd','mdwn'],
            geometry: ['stl','fbx','obj'],
            pdf: ['pdf'],
            msoffice: ['doc','docx','xlst','pptx'],
            openoffice: ['odf']
        }
    }

    determineFileType(filename){
        let forExtension = /[.-\w]+\.(\w+$)/i
        let extension = filename.match(forExtension)
        if(!extension) return "file" // exit with generic "file" if no regex result
        extension = extension[1].toLowerCase() // extract match from regex result
        for(var format in this.knownFormats){
            if(this.knownFormats[format].includes(extension)){
                return format
            }
        }
        return "file"
    }

    fetchDirectory(pathname){ 
        this.headerTitle.textContent = '...'      
        this.props = {lastUpdate: Date.now()} 
        return fetch(this.listFunc(pathname), {
            method: 'post',
            credentials: 'same-origin',
            redirect: 'error'
        })
        .then(response => {
            this.headerTitle.textContent = response.url.split('?')[0].slice(location.origin.length)
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
        return `<file-block tabindex="0" filetype="${props.type}" title="${props.name}">
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
            .map(name => this.makeMarkup({type: this.determineFileType(name), name: name}))
        
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

    get blockFromFileType(){
        /* this is probably not great. Blocks should register themselves to a global map */
        /* I am a codemirror block and I am for code files */
        /* I am a video block and I am for videos */
        return {
            directory: DirectoryBlock,
            table: TableBlock,
            // image: ImageBlock,
            // audio: AudioBlock,
            // video: VideoBlock,
            code: TextareaBlock,
            file: TextareaBlock,
            markdown: TextareaBlock,
            // geometry: TextareaBlock
        }
    }

    openFileFrom(node){
        var newSibling = new this.blockFromFileType[node.getAttribute('filetype')]
        var trailingSlash = node.getAttribute('filetype') == 'directory' ? '/' : ''
        var newSource = this.props.src + node.getAttribute('title') + trailingSlash

        document.getSelection().empty() // doubleclicking shouldn't select text. maybe this breaks expected behavior, but you can still select and click and drag            
        newSibling.props = { src: newSource }
        this.insertSibling(newSibling)
        newSibling.focus()
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