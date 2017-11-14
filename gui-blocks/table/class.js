class TableBlock extends TextareaBlock {
    constructor(){
        super()

        this.addEventListener('init', () => {
            this.table = this.shadowRoot.querySelector('table')
        })

        // this load will fire when the fetch for the file (in src attribute) completes
        this.addEventListener('load', () => {
            // this promise will resolve immediately if the script is already available
            this.attachGlobalScript('/gui-blocks/table/assets/papa.js').then(()=>{
                this.data = Papa.parse(this.textarea.value).data
                this.table.style.display = 'none' 
                this.buildTable(this.data)
                this.textarea.style.display = 'none'
                this.table.style.display = 'table'
            })
        })
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))

    }

    buildTable(arrayOfarrays){
        // destroy anything that's already there
        while (this.table.firstChild) {
            this.table.removeChild(this.table.firstChild)
        }
        for(var row of arrayOfarrays){
            var tr = document.createElement('tr')
            for(var datum of row){
                var td = document.createElement('td')
                td.textContent = datum
                tr.appendChild(td)
            }
            this.table.appendChild(tr)            
        }
    }

    // add row and add column tables 
    // dimensions can be announced in props
    // hint to hit esc to exit edit mode

}

