class BecomeBlock extends ProtoBlock {
    constructor(props){super(props)}

    static create(){
        let childNodes = this.constructor.blockAvailability.map(block => ({"li":{
            "block-name": block + '-block',
            "tabIndex": 0,
            "textContent": block
        }}))
        console.log(childNodes)
        this.child['block-list'].appendChild(this.createElementFromObject({ul: { childNodes }}))
    
        Array.from(this.child['block-list'].querySelectorAll('li'), li => {
            li.addEventListener('click', becomeSelect.bind(this))
            li.addEventListener('keydown', becomeSelect.bind(this))
        })
    }

    becomeSelect(event){
        if(event.type == 'keydown' && event.key != 'Enter') return null // ignore nonEnter key events
        event.preventDefault() // solve mystery bug where if this node gets replaced with something that has a form, the keydown fires the submit as soon as it comes into existance, so yeah, prevent that
        let theElementToBecome = event.target.getAttribute('block-name')
        this.replaceWith(document.createElement(theElementToBecome))
    }
}