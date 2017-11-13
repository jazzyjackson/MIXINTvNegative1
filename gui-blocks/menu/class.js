class MenuBlock extends ProtoBlock {
    constructor(){
        super()
        this.addEventListener('init', () => {

            this.addEventListener('click', event => {
                this.props.active ? this.destroyMenu()
                                  : this.createMenu()
            })
            this.shadowParent.setAttribute('tabIndex', 0) // make any block with a menu focusable
            this.shadowParent.addEventListener('keydown', event => {   
                if(event.target != this.shadowParent) return null // don't react of event bubbled through this node, also 'this' is still MenuBlock
                event.key == 'Enter' && this.createMenu()
                event.key == 'Escape' && (this.destroyMenu() || this.shadowParent.focus())
            })
            this.shadowParent.addEventListener('blur', event => {
                console.log("BLUR")
                console.log(document.activeElement)
                setTimeout(()=>{
                    console.log("BLUR NEXT")
                    console.log(this)
                    console.log(document.activeElement)
                    if(!this.contains(document.activeElement)){
                        this.destroyMenu()
                    }
                })
            })
        })
    }   
    
    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))        
    }

    createMenu(){
        if(this.props.active) throw new Error("You managed to call createMenu when a menu was already active.")
        
        this.setAttribute('active','true')
        console.log("creating menu")
        console.log(this.shadowParent)
        console.log(this.shadowParent.actionMenu)
        // maybe inspect actionMenu and throw a warning for duplicate names? 
        this.appendActionList(this.shadowParent.actionMenu)
        // set visibility hidden, appendActionList, check height of action list, set height to 0, set visibilility to visibile, set height to measured height, set height to null. this animates it but then releases the restriction
    }

    destroyMenu(){
        this.removeAttribute('active') // so this.props.active is undefined, falsey
        var list = this.shadowRoot.querySelector('ul')
        list && list.remove()
    }

    appendActionList(actionArray){
        /*receives an array of my shoehorned tuple of either type:
        actionName(string): actionObject(object)
        or:
        actionName(string): actionArray(array)
        if each 'tuple' is of the former, then we add an LI of that name and a listener that can turn it into an action-invoker
        else we add an LI, append a '...' and add a listener that can call appendActionList on the LI
        
        The unfortunate thing is that javascript doesn't have tuples, so instead I have objects with a single key,
        so I access the actionName with Object.keys(action)[0] and the item with 
        but first, make a UL and appendChild from whatever "this" is, then construct those LIs
        */
        var list = document.createElement('ul')
        actionArray.forEach(actionObject => {
            console.log("actionObject", actionObject)
            var actionItem = document.createElement('li')
            var actionName = Object.keys(actionObject)[0]
            var action = actionObject[actionName]
            actionItem.textContent = actionName
            actionItem.setAttribute('tabIndex', 0)
            if(Array.isArray(action)){
                // event listener will be like this.appendActionList.call(actionItem, action)
            } else {
                actionItem.addEventListener
                // event listener like makeActionCaller, enclose a reference to actionItem but replace it with actionCaller
            }
            list.appendChild(actionItem)
        })
        this.shadowRoot.appendChild(list)
    }
}