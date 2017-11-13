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
            // this.shadowParent.addEventListener('blur', event => {
            //     setTimeout(()=>{
            //         if(!this.contains(document.activeElement)){
            //             this.destroyMenu()
            //         }
            //     })
            // })
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
        let becomeAction = event => {
            console.log("BECOME ACTION", actionObject)
            if(event.type == 'keydown' && event.key != 'Enter') return null // ignore nonEnter key events
            event.preventDefault()
            event.stopPropagation()

            let menuBlock = this.shadowRoot.querySelector('menu-block')
            let menuList = menuBlock.shadowRoot.querySelector('ul')
            console.log(menuList)
            
            let oldMenuOption = event.target
            let newMenuOption = document.createElement('li')
            newMenuOption.setAttribute('tabIndex', 0)
            let nameSpan = document.createElement('span')
            nameSpan.textContent = 'this.' + actionObject.func.name + '(' //I'll use old textContent cuz it already has those non-breaking spaces/hyphens stuck in
            let formNode = document.createElement('form')
            formNode.addEventListener('submit', event => event.preventDefault()) // actually don't submit if someone goes and hits enter
            formNode.addEventListener('click', event => event.stopPropagation()) // actually don't submit if someone goes and hits enter
            Array.isArray(actionObject.args) && actionObject.args.forEach(argObject => {
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
                } else {
                    argNode.setAttribute('placeholder', argObject[formType])
                }
            })
            let closeSpan = document.createElement('span')
            closeSpan.textContent = ')'
            newMenuOption.appendChild(nameSpan)
            newMenuOption.appendChild(formNode)
            newMenuOption.appendChild(closeSpan)
            oldMenuOption.replaceWith(newMenuOption)
            newMenuOption.focus()

            let callFuncWithArgs = event => {
                if(event.target != newMenuOption && event.target.tagName != 'SPAN') return null
                if(event.type == 'keydown' && event.key != 'Enter') return null
                console.log("Calling")
                console.log(actionObject)
                let argsFromForm = Array.from(newMenuOption.querySelectorAll('form > *'), argument => argument.value) // This is kind of funny, if you call Array.from with a single node (instead of a node list) it grabs the children of that node, neat.) Could also be Array.from(this.querySelectorAll('form > *'))
                actionObject.func.call(this, ...argsFromForm)
                newMenuOption.replaceWith(oldMenuOption)
                menuBlock.toggleVisibility('hidden')
            }

            newMenuOption.addEventListener('click', callFuncWithArgs)
            newMenuOption.addEventListener('keydown', callFuncWithArgs)

            /* modifies the menuOption, adds an event listener to execute after collecting options */
            // var args = prompt('what should I pass to ' + actionObject.func.name)
            // actionObject.func.call(this, args)
        }
        return becomeAction
    }
}