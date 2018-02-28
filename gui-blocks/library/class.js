class LibraryBlock extends ProtoBlock {
    constructor(props){super(props)}

    static get actions(){
        return [
            {"update source": {
                func: HTMLElement.prototype.setAttribute,
                args: [{label: "src"}, {input: ["full pathname"]}],
                default: [null, ctx => "~"],
                info: "effectively cd a.k.a. change directory"
            }},
            {"download archive": {
                func: this.prototype.bashAndBecome,
                args: [{label: "zip -r"}, {input: "full pathname"}],
                default: [null, ctx => ctx.getAttribute('src')],
                info: "Sends a POST command to create archive the current directory. Archive is written to /TMP and when the POST resolves, a download tag is created and clicked for you, downloading the archive directly from disk"
            }},
            {"new directory": {
                func: this.prototype.bashAndBecome,
                args: [{label: "mkdir"},{input: "new directory name"}],
                default: [null, ctx => Date.now()],
                info: "Sends the 'mkdir' command to create a new directory, if you have permission to do so in this directory"
            }},
            {"new file": {
                func: this.prototype.bashAndBecome,
                args: [{input: "filename"}],
                default: [ctx => Date.now() + '.txt'],
                info: "Sends the 'touch' command to create a new file, if you have permission to do so in this directory"
            }}
        ]
    }

    static get reactions(){
        return [
            {
                watch: ['src'],
                react: function(attributeName, oldValue, newValue){
                    console.log("dealing with", newValue)
                    if(newValue == oldValue) return null // ignore 
                    if(/\/$/.test(newValue) == false){
                        var lastSlashIndex = newValue.split('').reverse().join('').indexOf('/')
                        if(lastSlashIndex) this.props.src = newValue.slice(0, -lastSlashIndex)
                        else alert("bad pathname, sending you home"), this.props.src = '~'
                    } else {
                        this.props.lastUpdate = Date.now()
                        this.fetchFileList(newValue)
                        .then(this.iconsFromFiles.bind(this))
                        // also a good place to start background animation
                    }
                }
            },{
                watch: ['listMode'],
                react: function(){
                    // the attribute will change the style of all the fileblocks
                    // actually I might not even need to do antyhing here
                    // maybe ask if the user wants to fetch 100+ file stats
                    // thinking of letting many stat operations happen at once...
                    // maybe as an event source to get partical data back
                    // otherwise I hate the idea even of just waiting on 100 stat calls and then getting one object back
                    // fill the data in as fast as you can, but one at a time, just so I can see your progress.
                }
            }
        ]
    }

    static build(){
        this.props.src = this.resolvePath(this.props.src || '~' || '/')
        console.log('source is', this.props.src)
        console.log('the path has been resolved')
        // reflow fileDetail on resize! could use a debouce, but its not a big deal
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

    buildIcon(props){
        return this.createElementFromObject({
            "file-block": {
                tabIndex: 0,
                contentType: props.contentType,
                title: props.name,
                childNodes: [
                    {"file-icon":{}}, // this could possibly just be a before pseudo element, but flexbox flow is easier for me if this actually exists
                    {"file-name":{
                        textContent: props.name
                    }}
                ],
                addEventListener: {
                    focus: event => {
                        let fileDetail = this.insertFileDetail(event.target) // listens for load                  
                        this.fetchFileDetail(event.target).then(stats => {
                            event.target.stats = stats
                            event.target.dispatchEvent(new Event('load'))
                        })
                    },
                    dblClick: event => {
                        this.openFileFrom(node)
                    }, 
                    keydown: event => {
                        event.key == 'Enter' && this.openFileFrom(node)
                    }
                }
            }
        })
    }

    makeDateString(zulutime){
        if(!zulutime) return '...' // waiting for date
        let dateObj = new Date(zulutime)
        return dateObj.toLocaleTimeString() + ' ' + dateObj.toDateString() 
    }

    iconsFromFiles(lsResult){
        this.data = lsResult // stash plain text in hidden TextArea, could be retrieved or linked or modified without internet.
        this.child['header-title'].textContent = this.props.src
        while(this.child['file-list'].childElementCount){
            this.child['file-list'].firstChild.remove()
        }
        // oof, this is kind of hardcoding the order of files... need to maybe have a list of concat algorithms availble to select... folders first? by date? Alphanumeric? ASCIInumeric?
        // you could combine this into a single filter map pretty easily, but I wanted to iterate and get folders, then iterate and get a second list of files, and this seems the obvious way to do that
        let folders = this.data.split('\n')
            .filter(line => line && line.slice(-1) == '/') // ends with /
            .map(line => this.buildIcon({
                ino: parseInt(line), 
                name: line.slice(line.indexOf(' ')).slice(1,-1), // drop leading space, drop trailing slash
                contentType: "application/library"
            }))

        let files = this.data.split('\n')
            .filter(line => line && line.slice(-1) != '/') // does not end with /
            .map(name => this.buildIcon({
                contentType: null, // don't know the contentType yet, will have to wait for stat. could at least figure out socket / FIFO by changing this.lsArgs
                name: line.slice(line.indexOf(' ')).trim(), // drop leading space
            }))
        
        // setting text of HTML creates subtree
        folders.concat(files).forEach(node => {
            this.child['file-list'].appendChild(node)
        })
    }

    insertFileDetail(node){
        // store a reference to a selected file-block so this function can be called 
        this.lastActive = node
        this.waitingForFetch = node
        if(node.stats == undefined){
            node.stats = {} // make it empty so the HTML template will render 'undefined'
            node.addEventListener('load', () => {
                // call insert again once the data is gathered
                // continue rendering undefined file details in the meantime
                // you'll still have name, source, and file download link
                this.insertFileDetail(node)
            },{once: true})
        } else {
            loading = false
            Object.entries(node.stats).map(entry => {
                node.setAttribute(...entry)
            })
        }
        
        // render everything empty... statObj will be undefined, until its not...
        // and if update isn't set, the css sort of grays it all out

        // this should grab a template and fill in via data binding... someday someday
        let oldFileDetail = this.shadowRoot.getElementById('file-detail')
        oldFileDetail && oldFileDetail.remove()

        let newFileDetail = this.createElementFromObject({
            'file-detail': {
                contentType: node.getAttribute('contenttype'),
                childNodes: [
                    {'data-name': {textContent: node.getAttribute('title')}},
                    {'data-mode': {textContent: this.octal2symbol(statObj.mode)}},
                    {'data-atime': {textContent: this.makeDateString(statObj.atime)}},
                    {'data-mtime': {textContent: this.makeDateString(statObj.mtime)}},
                    {'data-ctime': {textContent: this.makeDateString(statObj.ctime)}},
                    {'data-size': {textContent: this.formatBytes(statObj.size)}},
                    {footer: {childNodes: [
                        {span: {textContent: 'source: '}},
                        {a: {
                            tabIndex: -1,
                            title: "Click to download",
                            download: node.getAttribute('title'),
                            href: this.props.src + node.getAttribute('title'),
                            textContent: this.props.src + node.getAttribute('title')
                        }}
                    ]}}
                ]
            }
        })
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

    }

    openFileFrom(node){
        var contentType = node.getAttribute('content-type')
        var trailingSlash = contentType == 'application/library' ? '/' : ''
        var newSource = this.props.src + node.getAttribute('title') + trailingSlash
        
        document.getSelection().empty() // doubleclicking shouldn't select text. maybe this breaks expected behavior, but you can still select and click and drag            
        // here's where I would search mime for an ideal block to open file
        // this will be the part where I check guiblocks for mime, exact match first, fall back to half match...

        contentType == 'application/library' ? this.replaceWith(new LibraryBlock({src: newSource}))
                                             : this.insertAdjacentElement('afterend', new TextareaBlock({ src: newSource }))
        // this is kind of a dumb hack to prevent any animations from starting from position left: 0
        // don't be visible until 'nextTick' of event loop, assuming any style applied via mutation observer get applied before starting an animation
    }
    /*
    OH YEAH that's what I was really sad I deleted
    I'll have to remember this clever code where I think it was a sort of ternary, or a || || break through thing that lit up whether an rwx applied to you based on what group you're in and the ownership of that group. I don't know if it will ever look as good as when I first came up with it.
    basically take octal2symbol array, get the owner of the node, the group of the node, what groups your id is in, and what your uid is, and then say,
    Find out if you can read the file: is world readable? true : is group readable and are you part of the group ? true : is owner readable 
    */
    bashAndBecome(exec, arg){
        return kvetch.post(this.props.src + exec, {args: dirname})
        // maybe disable interactivity for this brief moment before reloading... maybe a good time to flip a class to fade out...
        // ... this.become() will trigger a new ls -> re-render, which should have its own sort of flexbox animation....
        .then(()=>{ this.become() }) // calling this.become with no argument re-creates / re-loads the current block from src
        .catch(console.error)
    }

    octal2symbol(filestat){
        // bit shifting magic to extract read write execute permission for owner, group, and world
        // adapted from https://github.com/mmalecki/mode-to-permissions/blob/master/lib/mode-to-permissions.js
        if(!filestat) return ['.........']
        else return [
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

    //OK this one I ripped off stackoverflow: http://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript#18650828
    formatBytes(bytes,decimals) {
        if(Number.isNaN(parseInt(bytes))) return '... Bytes'
        if(bytes == 0) return '0 Byte';
        var k = 1000; // or 1024 for binary
        var dm = decimals + 1 || 3;
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}