class MultiplexBlock extends ProtoBlock {
    constructor(props){super(props)}

    static get actions(){
        // update max show
    }

    static get reactions(){
        return [
            {
                watch: ['show-start','show-max'],
                react: function(attributeName, oldValue, newValue){
                    this.reCalculateChildren()
                }
            }
        ]
    }

    static build(){
        this.dimensionProp = screen.orientation.type.includes('landscape') ? 'width' : 'height'
        this.positionProp  = screen.orientation.type.includes('landscape') ? 'left'  : 'top'
        /* hoist child nodes of custom element INTO the shadowRoot of this */
        // my version of slotting. Should I be using slots for this? 
        // if the only childElement is the style, append a couple of become-blocks
        Array.from(this.children, child => this.shadowRoot.appendChild(child)) // this will trigger mutation            
        /* some default attributes */
        this.showStart || (this.showStart = 0) //0th is style tag
        this.showMax || (this.showMax = 2) // attribute change will fire reCalculateChildren()
        // new MutationObserver(...).observe(this.shadowRoot.children)
        // watch child nodes for new nodes, deleted nodes, and replaced nodes
        new MutationObserver(events => {
            events.forEach(event => {
                event.addedNodes.forEach(newChild => {
                    if(!Array.from(this.shadowRoot.children).includes(newChild)){
                        // mutation from further down the tree, no action required
                        return null
                    }
                    console.log("INIT", newChild.props)
                    let lastVisibleIndex = this.showStart + this.showMax - 1 // -1 to get to Array Index n                
                    /* nthIndex should be index of child ignore style attributes, 
                    /* subtract zerothindex, which is lenght - familysize, to get to which child this is */
                    let nthIndex = this.whatChildIsThis(newChild) - this.zerothindex
                    newChild.setAttribute('deflate', true)
                    
                    if(nthIndex > lastVisibleIndex){
                        this.showStart += 1 // will synchronously trigger a recalc, setting style left to destination postion      
                    } else {
                        this.reCalculateChildren()                                                    
                    }
                    setTimeout(()=>{
                        newChild.removeAttribute('deflate')
                    })                    
                })

                event.removedNodes.forEach(oldChild => {
                    let nth = oldChild.getAttribute('tabindex')
                    let lastVisibleIndex = this.showStart + this.showMax
                    if(this.familysize < lastVisibleIndex){
                        /* assumes that the node that was removed was visible */
                        this.showStart -= 1
                        lastVisibleIndex--
                    }
                    this.reCalculateChildren()   
                    // focus whatever child has the new tabindex equal to the old one
                    let replacementChild = this.shadowRoot.querySelector(`[tabindex="${nth}"]`)
                    replacementChild && replacementChild.focus()                                            
                })

                // if 'become' was called, a node will be destroyed with a fresh one in its place
                // addedNodes will equal removedNodes, and I'll need to give the new node new dimensions
                if(event.addedNodes.length == event.removedNodes.length){
                    this.reCalculateChildren()                                
                }
            })
        }).observe(this.shadowRoot, {childList: true})

        this.addEventListener('keydown', event => {
            /* modify max and start with ctrl+shift+[wasd] */
            if(!(event.ctrlKey & event.shiftKey)) return null
            event.stopPropagation()
            switch(event.key){
                case 'ArrowUp': this.showMax++; break;
                case 'ArrowLeft': this.showStart > 1 && this.showStart--; break;
                case 'ArrowDown': this.showMax > 2 && this.showMax--; break;
                case 'ArrowRight': this.showStart < this.shadowRoot.children.length - this.showMax && this.showStart++; break;
            }
        })
        /* handle screen rotation */
        this.addEventListener('orientationchange', event => {
            this.dimensionProp = screen.orientation.type.includes('landscape') ? 'width' : 'height'
            this.positionProp  = screen.orientation.type.includes('landscape') ? 'left'  : 'top'
        })
    }

    // reCalculateChildren defined by subclasses, vsplit, hsplit, fibonacciplex
    get familysize(){
        /* ignore stylesheets in number of children */
        /* ignore first non style block, 'titleblock' */
        let styleCount = this.shadowRoot.querySelectorAll('style, link').length
        return this.shadowRoot.childElementCount - (styleCount + 1)
    }
    get zerothindex(){
        return this.shadowRoot.children.length - this.familysize
    }

    set showStart(newStartIndex){
        this.setAttribute('show-start', newStartIndex)
    }
    get showStart(){
        return parseInt(this.getAttribute('show-start'))
    }
    set showMax(newShowMax){
        this.setAttribute('show-max', newShowMax)
    }
    get showMax(){
        return parseInt(this.getAttribute('show-max'))
    }

    whatChildIsThis(node){
        /* if node is child of component, return the array index, else -1 */
        return Array.from(this.shadowRoot.children).indexOf(node)
    }


    reCalculateChildren(){
        /* could be multiple styles, next child is title-block, so styleCount + 1 */
        switch(this.familysize){
            case 0:
                this.shadowRoot.appendChild(new BecomeBlock); 
                break;
            case 1:
                this.shadowRoot.children[this.zerothindex].setAttribute('tabIndex',1)
                this.shadowRoot.children[this.zerothindex].setAttribute('onlyChild',true)
                this.shadowRoot.children[this.zerothindex].focus()
                this.shadowRoot.children[this.zerothindex].style.width = '100%'; 
                this.shadowRoot.children[this.zerothindex].style.left = '0px'; 
                break;
            default: 
                let width = 100 / this.showMax
                let start = this.showStart
                Array.from(this.shadowRoot.children).slice(this.zerothindex).map((child, nth) => {
                    child.removeAttribute('onlyChild')
                    // if nth is NOT between showStart and (showStart + showMax), flip the tabIndex to negative. negative tabIndex is skipped in tab navigation.
                    child.setAttribute('tabIndex', nth >= this.showStart && nth < this.showStart + this.showMax ? nth : -nth)
                    child.style[ this.dimensionProp ] = `${100 / this.showMax}%`
                    child.style[ this.positionProp  ] = `${100 / this.showMax * (nth - start)}%`
                    child.style.position = 'fixed' // forgot why I did this
                })
        }
    }
}