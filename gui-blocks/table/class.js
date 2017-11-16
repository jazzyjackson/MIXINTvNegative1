class TableBlock extends TextareaBlock {
    constructor(props){
        super(props)

        // this load will fire when the fetch for the file (in src attribute) completes
        this.addEventListener('load', () => {
            // this promise will resolve immediately if the script is already available
            this.attachGlobalScript('/gui-blocks/table/assets/papa.js').then(()=>{
                this.parsedData = Papa.parse(this.data).data
                
                this.child['table'].style.display = 'none' 
                this.buildTable(this.parsedData)
                this.child['textarea'].style.display = 'none'
                this.child['table'].style.display = 'table'
            })
        })
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))
                         && this.dispatchEvent(new Event('ready'))
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

