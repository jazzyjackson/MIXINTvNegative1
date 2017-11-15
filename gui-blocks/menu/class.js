class MenuBlock extends ProtoBlock {
    constructor(props){
        super(props)
        this.addEventListener('init', () => {
            this.addEventListener('click', event => {
                this.props.active ? this.destroyMenu()
                                  : this.createMenu()
            })
            this.shadowParent.setAttribute('tabIndex', 0) // make any block with a menu focusable
            this.shadowParent.addEventListener('keydown', event => { 
                if(event.key == 'Escape'){
                    this.destroyMenu()
                    this.shadowParent.focus()
                }
                if(event.path[0] == this.shadowParent && event.key == 'Enter'){
                    this.createMenu()                 
                }
            })
            this.shadowParent.addEventListener('blur', event => {
                if(event.relatedTarget){
                    // if relatedTarget property exists, that means focus has left this block entirely, go ahead and deactivate menu
                    this.destroyMenu()
                }
            })
            if(this.shadowParent.getAttribute('autofocus') != "false"){
                // this is kind of sloppy but I don't see a problem with it,
                // but could become a problem if the component loads especially slow
                // I think I need a more robust way to fire a 'load' event when the shadowRoot is "ready"
                setTimeout(()=> this.shadowParent.focus(),100)
            }
        })
    }   
    
    connectedCallback(){
        this.initialized || this.dispatchEvent(new Event('init'))        
    }

    createMenu(){
        if(this.props.active) throw new Error("You managed to call createMenu when a menu was already active. Hit 'esc' to destroy menu.")
        
        this.setAttribute('active','true')
        // maybe inspect actionMenu and throw a warning for duplicate names? 
        let newListElement = this.appendActionList(this.shadowParent.actionMenu)
        
        newListElement.style.top = this.shadowParent.header.getClientRects()[0].height 
        // set visibility hidden, appendActionList, check height of action list, set height to 0, set visibilility to visibile, set height to measured height, set height to null. this animates it but then releases the restriction
    }

    destroyMenu(){   
        // not sure why I can't call menuBlock.destroyMenu() :/     
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
        actionArray.forEach(actionTuple => {
            console.log("actionObject", actionObject)
            var actionItem = document.createElement('li')
            var actionName = Object.keys(actionTuple)[0]
            var actionObject = actionTuple[actionName]
            actionItem.textContent = actionName
            actionItem.setAttribute('tabIndex', 0)
            if(Array.isArray(actionObject)){
                actionItem.textContent += '...'
                // event listener will be like this.appendActionList.call(actionItem, action)
            } else {
                // createActionFor returns a function that mutates the LI and invokes function references by actionObject.func 
                let actionCaller = this.createActionFor.call(this.shadowParent, actionObject)
                actionItem.addEventListener('click', actionCaller)
                actionItem.addEventListener('keydown', actionCaller)
                // event listener like makeActionCaller, enclose a reference to actionItem but replace it with actionCaller
            }
            list.appendChild(actionItem)
        })
        this.shadowRoot.appendChild(list)
        return list
    }

    createActionFor(actionObject){
        // height is going to be affected by adding form elements, lets take off the height restriction that just exists for animation purposes

        // *THIS* is the parent Block of the menu here 
        // the this of createActionTo will be the HTML node, the 'block'

        /* might be undefined, in that case, just invoke the function, no args */
        /* otherwise, it should be an array of objects, whose key is the type of input. Text, Number, Select, 
        /* following keyname is either the default option or the content of the select form... */
        
        /* new plan. event listener is attached to DOM node. the function returned is attached to LI node
          on click, the function is called, and the node is replaced with a new node ( a better node ) that allows selection and confirmation of action
          an onclick listener is attached to that new node, and when its called, it calls the bound function
          which closes the menu, but more importantly destroys the new node that was created on click,
          and possibly restores the old node with event listener in tact. huh. */
        return event => {
            console.log("BECOME ACTION", actionObject)
            if(event.type == 'keydown' && event.key != 'Enter') return null // ignore nonEnter key events
            event.preventDefault()
            event.stopPropagation()

            let menuBlock = this.shadowRoot.querySelector('menu-block')
            let menuList = menuBlock.shadowRoot.querySelector('ul')
            
            let oldMenuOption = event.target
            let newMenuOption = document.createElement('li')
            newMenuOption.setAttribute('tabIndex', 0)
            let nameSpan = document.createElement('span')
            nameSpan.textContent = 'this.' + actionObject.func.name + '(' //I'll use old textContent cuz it already has those non-breaking spaces/hyphens stuck in
            let formNode = document.createElement('form')
            formNode.addEventListener('click', event => event.stopPropagation()) // capture form clicks so they don't fire "destroyMenu() higher up"
            // if you have actionObject.default it better be an array of functions with the same length as actionObject.args
            Array.isArray(actionObject.args) && actionObject.args.forEach((argObject, argIndex) => {
                let formType = Object.keys(argObject)[0] // each arg option is expected to have a single key. If javascript had tuples I'd use those.
                let argNode = document.createElement(formType)
                argNode.setAttribute('tabIndex', 0)
                formNode.appendChild(argNode)
                if(formType == 'select'){
                    argObject[formType].forEach(argOption => {
                        let optionNode = document.createElement('option')
                        optionNode.setAttribute('value', argOption)
                        optionNode.textContent = argOption
                        argNode.appendChild(optionNode)
                    })
                    if(actionObject.default){
                        argNode.value = actionObject.default[argIndex](this) // pass context
                    }
                    
                } else {
                    argNode.setAttribute('placeholder', argObject[formType])
                    if(actionObject.default){
                        argNode.value = actionObject.default[argIndex](this) // pass context
                    }
                }
            })
            let closeSpan = document.createElement('span')
            closeSpan.textContent = ')'
            newMenuOption.appendChild(nameSpan)
            newMenuOption.appendChild(formNode)
            newMenuOption.appendChild(closeSpan)
            oldMenuOption.replaceWith(newMenuOption)
            newMenuOption.focus()

            // if a different menuOption is focused, rollback to unactivated status
            // So you always have to click twice to invoke
            // instead of accidentally leaving this.remove() open while you try to click on the one next to
            newMenuOption.addEventListener('blur', event => {
                if(!newMenuOption.contains(event.relatedTarget)){
                    newMenuOption.replaceWith(oldMenuOption)
                } else {
                    /* for the case that a child of the menu option (likely a form element)
                        was focused, but then moved away from, we listen for blurs from children, too */
                    event.relatedTarget.addEventListener('blur', event => {
                        if(!newMenuOption.contains(event.relatedTarget)){
                            newMenuOption.replaceWith(oldMenuOption)
                        }
                    })
                }
                /* I'm only crossing my fingers that adding nested anonymous listeners enclosing DOM nodes
                    doesn't cause memory leaks, but when one of these is finally called the entire parent tree
                    (the <ul> containing all the menu options) is destroyed (or at least I mean for it to be)
                    freeing the nodes to garbage collection, but if I left a path to GC root I am truly sorry */
            })

            let callFuncWithArgs = event => {
                if(event.type == 'click' && event.target != newMenuOption && event.target.tagName != 'SPAN') return null
                if(event.type == 'keydown' && event.key != 'Enter') return null
                event.preventDefault() // in case of a submit event, don't actually submit
                event.stopPropagation()
                // if newMenuOptions is still attached to the DOM, replace it with oldMenuOption
                // if a function call mutates / causes shadowParent to lose focus, the menu will be destroy, and replace would otherwise throw an error
                // but if a function call completes without the menu getting destroyed, I want to revert to old menu option
                
                let argsFromForm = Array.from(newMenuOption.querySelectorAll('form > *'), argument => argument.value) // This is kind of funny, if you call Array.from with a single node (instead of a node list) it grabs the children of that node, neat.) Could also be Array.from(this.querySelectorAll('form > *'))
                actionObject.func.call(this, ...argsFromForm)  
                menuBlock.destroyMenu()
                this.focus() 
            }

            newMenuOption.addEventListener('click', callFuncWithArgs)
            newMenuOption.addEventListener('keydown', callFuncWithArgs)
            formNode.addEventListener('submit', callFuncWithArgs)
            /* modifies the menuOption, adds an event listener to execute after collecting options */
            // var args = prompt('what should I pass to ' + actionObject.func.name)
            // actionObject.func.call(this, args)
        }
    }
}