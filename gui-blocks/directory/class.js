class DirectoryBlock extends ProtoBlock {
    constructor(){
        super()
    }

    connectedCallback(initializing){
        if(initializing || this.hasntBeenInitializedYet()){
            this.header = this.shadowRoot.querySelector('header')
            this.fileList = this.shadowRoot.querySelector('file-list')

            this.listFunc = (pathname) => `${pathname}?ls -ap1` /* a: list all (. and ..), p: append '/' to directory, 1: 1 file per line */
            this.statFunc = (pathname,filename) => `${pathname}?node -e "console.log(JSON.stringify(require('fs').statSync('${filename}')))`
            
            /* if src attribute wasn't set before being connected, set it as the current src */
            if(!this.props.src){
                this.setAttribute('src', location.pathname)
            }
            this.fetchDirectory(this.props.src)
        }
    }

    fetchDirectory(pathname){
        this.header.textContent = pathname      
        this.props = {lastUpdate: Date.now()} 
        fetch(this.listFunc(pathname), {
            method: 'post',
            credentials: 'same-origin',
            redirect: 'error'
        })
        .then(response => response.text())
        .then(listText => this.generateIcons(listText))
    }

    generateIcons(listText){
        let folders = listText.split('\n')
            .filter(name => name.slice(-1) == '/') // filter out anything thats not a directory
            .map(name => `<dir-block tabindex=0><file-name>${name.slice(0,-1)}</file-name></dir-block>`)

        let files = listText.split('\n')
            .filter(name => name && name.slice(-1) != '/') // filter out directories and empty lines
            .map(name => `<file-block tabindex=0><file-name>${name}</file-name></file-block>`)

        this.fileList.innerHTML = folders.concat(files).join('\n')

        Array.from(this.fileList.querySelectorAll('dir-block'), node => {
            node.addEventListener('dblclick', event => {
                let newBlock = document.createElement('directory-block')
                newBlock.props = {src: this.props.src + event.target.textContent + '/'}
                this.parentNode.appendChild(newBlock)
            })
        })
        Array.from(this.fileList.querySelectorAll('file-block'), node => {

        })
    }
}