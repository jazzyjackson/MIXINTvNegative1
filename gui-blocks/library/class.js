class LibraryBlock extends ProtoBlock {
    constructor(props){super(props)}

    static get actions(){
        return [
            {
                name: "download archive",
                func: this.prototype.archive,
                args: [{input: "pathname"}],
                default: [ctx => ctx.getAttribute('src')],
                info: "Sends a POST command to create archive the current directory. Archive is written to /TMP and when the POST resolves, a download tag is created and clicked for you, downloading the archive directly from disk"
            },
            {
                name: "new directory",
                func: this.prototype.mkdir,
                args: [{input: "directory name"}],
                default: [ctx => Date.now()],
                info: "Sends the 'touch' command to create a new file, if you have permission to do so in this directory"
            },
            {
                name: "new file",
                func: this.prototype.touch,
                args: [{input: "filename"}],
                default: [ctx => Date.now() + '.txt'],
                info: "Sends the 'touch' command to create a new file, if you have permission to do so in this directory"
            }
        ]
    }

    mkdir(dirname){
        return fetch(this.props.src + '?exec=mkdir&args=' + encodeURIComponent(dirname), {
            method: 'post',
            credentials: 'same-origin',
            redirect: 'error'
        })
        .then(()=>{ this.become() }) // calling this.become with no argument re-creates / re-loads the current block from src
        .catch(console.error)
    }

    touch(filename){
        return fetch(this.props.src + '?exec=touch&args' + encodeURIComponent(filename), {
            method: 'post',
            credentials: 'same-origin',
            redirect: 'error'
        })
        .then(()=>{ this.become() }) // calling this.become with no argument re-creates / re-loads the current block from src
        .catch(console.error)        
    }

    get pathname(){
        
    }
    
    static get observedAttributes(){
        return ['src']
    }

    static create(){
        this.setAttribute('src', this.resolvePath(this.props.src || '/'))                        
        if(/\/$/.test(this.props.src) == false){
            // if directory block was initialized with a src that didn't end in a slash,
            // find the index of the last slash and slice everything else off
            var lastSlashIndex = this.props.src.split('').reverse().join('').indexOf('/')
            this.setAttribute('src', this.props.src.slice(0, -lastSlashIndex))
            // /docs/utilities.csv becomes /docs/
        }
        this.fetchDirectory(this.props.src)
        .then(listText => {
            this.data = listText
            this.generateIcons()
        })

        this.addEventListener('resize', () => {
            this.lastActive && this.insertFileDetail(this.lastActive)
        })
        window.addEventListener('resize', () => {
            this.lastActive && this.insertFileDetail(this.lastActive)            
        })
    }


    archive(source){
        // fetch('/xz etc')
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
        this.setAttribute('lastUpdate', Date.now())
        /* ls -apl1
        -a list all in directory(. and ..)
        -p if file is directory add trailing slash
        -l treat links to directories as directories
        -1 one file per line */
        let pathname = this.props.src.split('/')
        return fetch(this.props.src + '?exec=ls&args=-apl1', {
            method: 'post',
            credentials: 'same-origin',
            redirect: 'error'
        })
        .then(response => {
            this.dispatchEvent(new Event('load'))
            return response.text()
        })
    }

    fetchStat(pathname, filename){
        // send options request for this file, get ownership/permission/size/a/c/mtime/etc back as JSON
        return fetch(encodeURIComponent(pathname + filename), {
            method: 'options',
            credentials: 'same-origin',
            redirect: 'error'
        })
        .then(response => response.json())
    }

    makeMarkup(props){
        return `<file-block tabindex="0" filetype="${props.type}" title="${props.name}">
                    <file-icon></file-icon>
                    <file-name>${props.name}</file-name>
                </file-block>`
    }

    makeDateString(zulutime){
        let dateObj = new Date(zulutime)
        return dateObj.toLocaleTimeString() + ' ' + dateObj.toDateString() 
    }

    generateIcons(){
        let folders = this.data.split('\n')
            .filter(name => name.slice(-1) == '/') // filter out anything thats not a directory
            .map(name => this.makeMarkup({type: "directory", name: name.slice(0,-1)}))

        let files = this.data.split('\n')
            .filter(name => name && name.slice(-1) != '/') // filter out directories and empty lines
            .map(name => this.makeMarkup({type: this.determineFileType(name), name: name}))
        
        // setting text of HTML creates subtree
        this.child['file-list'].innerHTML = folders.concat(files).join('\n')
        // and then I attach event listeners to all the nodes that exist all of a sudden
        Array.from(this.child['file-list'].querySelectorAll('file-block'), node => {
            node.details = node.querySelector('file-details')
            /* dblclick doesn't register for iphone, and focus will shift position in the middle of a dblclick */
            /* so I think I'll have to move the 'focus' css to a cusotm attribute, and determine whether to apply  */
            /* that attribute on click (so, with a delay in anticipation of a double click), using a timeout mechanism */
            node.addEventListener('focus', () => {
                this.fetchFileDetail(node)
                    .then(()=>{
                        this.insertFileDetail(node)
                    })
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

    insertFileDetail(node){
        // if there's already a file-detail element, destroy it.
        let oldFileDetail = this.child['file-list'].querySelector('file-detail')
        oldFileDetail && oldFileDetail.remove()
        let newFileDetail = document.createElement('file-detail')
        newFileDetail.setAttribute('filetype', node.getAttribute('filetype'))
        let href = this.props.src + node.getAttribute('title')
        newFileDetail.innerHTML = `   
            <data-name>${node.getAttribute('title')}</data-name>            
            <data-mode>${this.octal2symbol(node.getAttribute('mode'))}</data-mode>
            <data-atime>${this.makeDateString(node.getAttribute('atime'))}</data-atime>
            <data-mtime>${this.makeDateString(node.getAttribute('mtime'))}</data-mtime>
            <data-size>${node.getAttribute('size')} bytes</data-size>
            <footer>source:
                <a tabindex="-1" title="Click to download" download="${node.getAttribute('title')}" href="${href}">${href}</a>
            </footer>`.trim()

        // get list of children of file-list
        let fileblocks = Array.from(this.child['file-list'].children)
        let nth = fileblocks.indexOf(node)
        // slice off all the blocks preceding the focused node
        let nodeLeft = node.getClientRects()[0].left
        // iterate through the file-block nodes after the nth node
        for(var block of fileblocks.slice(nth + 1)){
            if(block.getClientRects()[0].left <= nodeLeft){
                // if we hit a block that is farther to the left than focused node, insert this before it
                this.child['file-list'].insertBefore(newFileDetail, block)
                break;
            }
        }
        // if, after looping through all the blocks, I did not find a new home for newFileDetail, tack it on to the end
        if(!newFileDetail.parentElement){
            this.child['file-list'].appendChild(newFileDetail)                            
        }

        this.lastActive = node
    }

    fetchFileDetail(node){
        return new Promise(resolve => {
            if(node.getAttribute('ino')){
                resolve()
             } else {
                this.fetchStat(this.props.src, node.getAttribute('title'))
                .then(stat => {
                    for(var item in stat){
                        node.setAttribute(item, stat[item])
                    }
                })
                .then(resolve)
            }
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
            file: TextareaBlock,
            markdown: ShowdownBlock,
            code: CodemirrorBlock,
            // geometry: TextareaBlock
        }
    }

    openFileFrom(node){
        var trailingSlash = node.getAttribute('filetype') == 'directory' ? '/' : ''
        var newSource = this.props.src + node.getAttribute('title') + trailingSlash
        
        document.getSelection().empty() // doubleclicking shouldn't select text. maybe this breaks expected behavior, but you can still select and click and drag            
        
        var fileBlock = this.blockFromFileType[node.getAttribute('filetype')]
        fileBlock == DirectoryBlock ? this.replaceWith(new fileBlock({src: newSource}))
                                    : this.insertAdjacentElement('afterend', new fileBlock({ src: newSource }))
        // this is kind of a dumb hack to prevent any animations from starting from position left: 0
        // don't be visible until 'nextTick' of event loop, assuming any style applied via mutation observer get applied before starting an animation
    }

    octal2symbol(filestat){
        // bit shifting magic to extract read write execute permission for owner, group, and world
        // adapted from https://github.com/mmalecki/mode-to-permissions/blob/master/lib/mode-to-permissions.js
        return [
            filestat >> 6 & 4      ? 'r' : '-',
            filestat >> 6 & 2      ? 'w' : '-',
            filestat >> 6 & 1      ? 'x' : '-',
            filestat << 3 >> 6 & 4 ? 'r' : '-',
            filestat << 3 >> 6 & 2 ? 'w' : '-',
            filestat << 3 >> 6 & 1 ? 'x' : '-',
            filestat << 6 >> 6 & 4 ? 'r' : '-',
            filestat << 6 >> 6 & 2 ? 'w' : '-',
            filestat << 6 >> 6 & 1 ? 'x' : '-',
        ].join('')
    }
}