class MenuBlock extends HTMLElement {
    constructor(){
        super()
        console.log("go go menublock")
    }   
    

    connectedCallback(){
        var template = document.querySelector(`template[renders="${this.tagName.toLowerCase()}"]`)
        if(!template) return console.error(`${this.tagName} has no template`)

        this.attachShadow({mode: 'open'})
        this.shadowRoot.appendChild(template.content.cloneNode(true))
        this.shadowParent = this.getRootNode().host // might want this.getRootNode().host if this block would be nested somehow, but I'm not expected that to happen.

        let menuList = document.createElement('ul')
        this.parentBlock = this.getRootNode().host
        // make parentBlock focusable
        this.parentBlock.setAttribute('tabIndex', 1)
        this.attachListeners()

      /* menu list is positioned absolutely against the right side */
        for(let optionName in this.parentBlock.actionMenu){
            let menuOption = document.createElement('li')
            menuOption.textContent = optionName
            let optionAction = this.createActionFor.call(this.parentBlock, optionName)
            menuOption.addEventListener('click', optionAction)
            menuOption.addEventListener('keydown', optionAction)
            menuOption.setAttribute('tabIndex',2)
            menuList.appendChild(menuOption)
        }
        this.shadowRoot.appendChild(menuList)
        /* transition should occur between 0 height and height of UL, but going from auto to 0 doesn't animate, so I have to explicitely set the max height as the calculated height. */
        menuList.style.height = menuList.getClientRects()[0].height
        this.parentBlock.setAttribute('menu','hidden')
        this.waitForParentInit().then(()=>{
            menuList.style.top = this.parentBlock.header.getClientRects()[0].height            
        })
    }

    createActionFor(optionName){
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
        let optionObject = this.actionMenu[optionName]
        let becomeAction = event => {
            if(event.type == 'keydown' && event.key != 'Enter') return null // ignore nonEnter key events
            let menuBlock = this.shadowRoot.querySelector('menu-block')
            let menuList = menuBlock.shadowRoot.querySelector('ul')
            let originalHeight = menuList.style.height
            menuList.style.height = 'unset'
            console.log("menuList")
            console.log(menuList)
            
            
            
            
            let oldMenuOption = event.target
            let newMenuOption = document.createElement('li')
            newMenuOption.setAttribute('tabIndex', 2)
            let nameSpan = document.createElement('span')
            nameSpan.textContent = 'this.' + optionObject.func.name + '(' //I'll use old textContent cuz it already has those non-breaking spaces/hyphens stuck in
            let formNode = document.createElement('form')
            formNode.addEventListener('submit', event => event.preventDefault()) // actually don't submit if someone goes and hits enter
            Array.isArray(optionObject.args) && optionObject.args.forEach(argObject => {
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
                console.log(optionObject)
                let argsFromForm = Array.from(newMenuOption.querySelectorAll('form > *'), argument => argument.value) // This is kind of funny, if you call Array.from with a single node (instead of a node list) it grabs the children of that node, neat.) Could also be Array.from(this.shadowRoot.querySelectorAll('form > *'))
                optionObject.func.call(this, ...argsFromForm)
                menuList.style.height = originalHeight
                newMenuOption.replaceWith(oldMenuOption)
                menuBlock.toggleVisibility('hidden')
            }

            newMenuOption.addEventListener('click', callFuncWithArgs)
            newMenuOption.addEventListener('keydown', callFuncWithArgs)

            /* modifies the menuOption, adds an event listener to execute after collecting options */
            // var args = prompt('what should I pass to ' + optionObject.func.name)
            // optionObject.func.call(this, args)
        }
        return becomeAction
        
    }

    waitForParentInit(){
        return new Promise( resolve => {
            if(this.parentBlock.initialized){
                resolve()
            } else {
                this.parentBlock.addEventListener('init', resolve)
            }
        })
    }

    toggleVisibility(optVisibility){
        if(!['hidden','visible',undefined].includes(optVisibility)){
            throw new Error("toggleVisibility must be called with 'hidden', 'visible', or no argument at all.")
        } else {
            console.log("toggling", optVisibility)
        }
        var oldVisibility = this.parentBlock.getAttribute('menu')
        let newVisibility = optVisibility || oldVisibility == 'visible' ? 'hidden' : 'visible'
        this.parentBlock.setAttribute('menu', newVisibility)
        Array.from(this.getElementsByTagName('li'), li => {
            li.setAttribute('tabIndex', newVisibility == 'visible' ? 2 : null)
        })
    }

    attachListeners(){
        this.parentBlock.addEventListener('keydown', event => {   
            if(event.target != this.parentBlock) return null // don't react of event bubbled through this node, also 'this' is still MenuBlock
            event.key == 'Enter' && this.toggleVisibility()
            event.key == 'Escape' && this.toggleVisibility('hidden')
        })
        this.addEventListener('click', event => {
            console.log(event.target)
            if(event.target != this && event.target.tagName != 'SPAN') return null // don't react of event bubbled through this node, also 'this' is still MenuBlock            
            this.toggleVisibility()          
        })
        this.parentBlock.addEventListener('blur', () => {
            setTimeout(()=>{
                if(!this.contains(document.activeElement)){
                    this.toggleVisibility('hidden')
                }
            })
        })
    }
}