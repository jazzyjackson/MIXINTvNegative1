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

    set hint(newVal){
        // if this.hint = null then hide the hint
        this.child['footer'].style.display = newVal ? "block" : "none"
        this.child['footer'].textContent = newVal
    }


    buildTable(arrayOfarrays){
        // destroy anything that's already there
        while (this.child['table'].firstChild) {
            this.child['table'].removeChild(this.child['table'].firstChild)
        }
        for(var row of arrayOfarrays){
            var tr = document.createElement('tr')
            for(var datum of row){
                var td = document.createElement('td')
                td.textContent = datum
                tr.appendChild(this.activateTableData(td))
            }
            this.child['table'].appendChild(tr)            
        }
        this.hint = "Select a cell and hit return to edit."
    }

    activateTableData(td){
        // setting an invisible property on the HTML object to retrieve if editing gets cancelled. td gets passed around
        td.originalContent = td.textContent
        td.setAttribute('tabIndex', 0) // allow td to be navigable by tabbing around
        td.addEventListener("focus", event => { 
            this.hint = "Hit Return to edit this cell."
        })
        td.addEventListener("keydown", event => { 
            // this switches a TD into edit mode
            if(event.shift || event.key != "Enter" || event.target != td) return null // exit if keydown wasn't enter, or if Shift+Enter was used
            this.hint = "Hit Return to update the table, Escape to cancel the edit."
            let staticCell = event.target
            staticCell.removeAttribute("tabIndex") // so that if you tab out of the textarea the focus flow is to the next cell
            let contentLength = staticCell.textContent.length
            let contentHeight = staticCell.getClientRects()[0].height
            staticCell.innerHTML = `<textarea tabIndex="0">${staticCell.textContent}</textarea>`
            staticCell.firstChild.setSelectionRange(contentLength, contentLength)
            staticCell.firstChild.focus()
            staticCell.parentElement.style.minHeight = contentHeight + 'px'

            staticCell.firstChild.addEventListener("blur", event => {
                this.cancelEdit(staticCell)
            })

            staticCell.firstChild.addEventListener('keydown', event => {
                if(event.shiftKey) return null // ignore events when shift is held down
                switch(event.key){
                    case "Escape":
                        event.stopPropagation() // parent block is still listening for escape to focus menu, lets not bubble up
                        this.cancelEdit(staticCell)
                        staticCell.focus()
                        break;
                    case "Enter":
                        this.updateTable(staticCell)
                        break;
                }
            })
        })
        return td
    }

    cancelEdit(cellToCancel){
        cellToCancel.textContent = cellToCancel.originalContent
        cellToCancel.setAttribute("tabIndex", 0) // so that if you tab out of the textarea the focus flow is to the next cell
    }

    updateTable(cellToUpdate){
        let colIndex = cellToUpdate.cellIndex
        let rowIndex = cellToUpdate.parentElement.rowIndex
        this.parsedData[rowIndex][colIndex] = cellToUpdate.firstChild.value.trim() // throw out newlines
        this.data = Papa.unparse(this.parsedData)
        this.buildTable(this.parsedData)
        this.child['table'].children[rowIndex].children[colIndex].focus()
        this.hint = "Your changes aren't saved to disk yet, use +overwrite."
    }

    // add row and add column tables 
    // dimensions can be announced in props
    // hint to hit esc to exit edit mode

}

