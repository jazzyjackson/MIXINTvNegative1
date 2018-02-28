class MenuBlock extends ProtoBlock {
    constructor(props){super(props)}

    static build(){
        this.addEventListener('click', event => {
            this.props.active ? this.destroyMenu() : this.createMenu()
        })
        this.shadowParent.addEventListener('blur', event => {
            // if relatedTarget property exists, that means focus has left this block entirely, go ahead and deactivate menu
            event.relatedTarget && this.destroyMenu()
        })
        this.shadowParent.addEventListener('keydown', event => { 
            if(event.key == 'Escape') this.click()
            // chrome only, event targets get retargeted to top level node, only way to check actualy key down target is with event.path, chrome only
        })
    }

    createMenu(){
        if(this.props.active) return null /* just exit if we're already active */
        else this.setAttribute('active','true')

        this.actionList = mixint.createElement({
            ul: {
                style: {top: this.shadowParent.child.header.getClientRects()[0].height + 'px'},
                childNodes: this.shadowParent.inheritedActions.map(actionTuple => {

                    var [ actionName, actionObject ] = Object.entries(actionTuple)[0]
        
                    if(actionObject.filter === false) return null // skip building list item if filter returns false
                    else return {'li':{
                        textContent: actionName,
                        class: actionObject.class || '',
                        style: actionObject.style || '',
                        tabIndex: 0,
                        addEventListener: {
                            click:  event => this.createActionFor.call(this.shadowParent, actionObject)(event),
                            keydown:  event => this.createActionFor.call(this.shadowParent, actionObject)(event)
                        }
                    }}
                })
            }
        })
        this.shadowRoot.appendChild(this.actionList)
    }

    destroyMenu(){
        // not sure why I can't call menuBlock.destroyMenu() :/     
        this.props.active = null // so this.props.active is undefined, falsey
        this.actionList && this.actionList.remove()
    }

    createActionFor(actionObject){
        /* when invoked by click or keydown on a li:
         * - creates a form node with all the placeholder / defaults / options as described in the argObject
         * - creates a li object to wrap around the form
         * - creates a callback function that will invoke the function pointed to by the argObject
         * - attaches the event listeners to the new li node
         * - replaces old li with new li & focuses the new li
         * * */
        return event => {
            if(event.type == 'keydown' && event.key != 'Enter') return null // ignore nonEnter key events
            event.preventDefault(), event.stopPropagation()
            /* creates a form node with all the placeholder / defaults / options as described in the argObject         */
            let formNode = mixint.createElement({form: {
                addEventListener: {
                    click: event => event.stopPropagation() // capture form clicks so they don't fire "destroyMenu() higher up"
                },
                childNodes: actionObject.args && actionObject.args.map((argObject, argIndex) => {
                    let [formType, formValue] = Object.entries(argObject)[0] // each arg option is expected to have a single key. If javascript had tuples I'd use those.
                    let argNode = {[formType]: {}}
                    let argAttributes = argNode[formType] // grab reference to object...

                    switch(formType){
                        case "input":
                            argAttributes.tabIndex = 0
                            argAttributes.placeholder = formValue
                            break
                        case "label":
                            argAttributes.textContent = `"${formValue}"`
                            argAttributes.value = formValue
                            break
                        case "select":
                            argAttributes.tabIndex = 0
                            argAttributes.childNodes = formValue.map(argOption => ({option: {
                                    textContent: argOption,
                                    value: argOption
                            }}))
                            break;
                        default:
                            console.error("Unrecognized form type", formType)
                    }
                    if(actionObject.default && actionObject.default[argIndex] instanceof Function){
                        argNode.value = actionObject.default[argIndex](this) // pass context
                    }
                    return argNode
                })
            }})
            /* creates a li object to wrap around the form */
            let newMenuOption = mixint.createElement({
                li: {
                    tabIndex: 0,
                    childNodes: [
                        { span: { textContent: `this.${actionObject.func.name}`}},
                        { span: { textContent: '('}},
                        formNode,
                        { span: { textContent: ')'}}
                    ]
                }
            })
            /* creates a callback function that will invoke the function pointed to by the argObject */
            let callFuncWithArgs = event => {
                if(event.type == 'click' && event.target != newMenuOption && event.target.tagName != 'SPAN') return null
                if(event.type == 'keydown' && event.key != 'Enter') return null
                event.preventDefault(), event.stopPropagation() // in case of a submit event, don't actually submit
                
                let argsFromForm = Array.from(newMenuOption.querySelectorAll('form > *'), argument => argument.value) // This is kind of funny, if you call Array.from with a single node (instead of a node list) it grabs the children of that node, neat.) Could also be Array.from(this.querySelectorAll('form > *'))
                actionObject.func.call(this, ...argsFromForm)  
                this.child["menu-block"].destroyMenu()
                this.focus() 
            }
            /* attaches the event listeners to the new li node */
            let oldMenuOption = event.target                        
            newMenuOption.querySelector('form').addEventListener('submit', callFuncWithArgs, {once: true})
            newMenuOption.addEventListener('click', callFuncWithArgs, {once: true})
            newMenuOption.addEventListener('keydown', callFuncWithArgs, {once: true})
            newMenuOption.addEventListener('blur', event => {
                /* revert to old menu option if focus moves away from the li */
                /* for the case that a child of the menu option (likely a form element)
                was focused, but then moved away from, we listen for blurs from children, too */
                if(!newMenuOption.contains(event.relatedTarget)){
                    newMenuOption.replaceWith(oldMenuOption)
                } else {
                    event.relatedTarget.addEventListener('blur', event => {
                        if(!newMenuOption.contains(event.relatedTarget)){
                            newMenuOption.replaceWith(oldMenuOption)
                        }
                    },{once: true})
                }
            })
            /* replaces old li with new li & focuses the new li */
            oldMenuOption.replaceWith(newMenuOption)
            newMenuOption.focus()
        }
    }
}