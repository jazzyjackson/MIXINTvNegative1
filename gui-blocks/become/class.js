class BecomeBlock extends ProtoBlock {
    constructor(props){super(props)}

    static build(){        
        this.child['block-list'].appendChild(mixint.createElement({
            ul: { 
                childNodes: window.guinames.map(block => ({
                    "li": {
                        "block-name": block + '-block',
                        "tabIndex": 0,
                        "textContent": block,
                        "addEventListener": {
                            "click": this.becomeSelect.bind(this),
                            "keydown": this.becomeSelect.bind(this)
                        }
                    } // end li object
                })) // end childNodes array
            } // end ul object
        })) // end object literal arrow function
    }

    becomeSelect(event){
        if(event.type == 'keydown' && event.key != 'Enter'){
            return null // ignore nonEnter key events
        } else {
            event.preventDefault() // solve mystery bug where if this node gets replaced with something that has a form, the keydown fires the submit as soon as it comes into existance, so yeah, prevent that
            let theElementToBecome = event.target.getAttribute('block-name')
            this.replaceWith(document.createElement(theElementToBecome))
        }
    }
}