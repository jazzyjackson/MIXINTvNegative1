class TableBlock extends TextareaBlock {
    constructor(){
        super()
        this.addEventListener('init', () => {
            this.table = this.shadowRoot.querySelector('table')
        })

        this.addEventListener('load', () => {
            // depends on assets/papa.js
            this.data = Papa.parse(this.textarea.value).data
            this.table.style.display = 'none' 
            this.buildTable(this.data)
            this.textarea.style.display = 'none'
            this.table.style.display = 'table'
        })
    }

    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))

    }

    buildTable(arrayOfarrays){
        // destroy anything that's already there
        while (this.table.firstChild) {
            this.table.removeChild(myNode.firstChild)
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


}

