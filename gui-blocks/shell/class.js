class ShellBlock extends ConvoBlock {
    constructor(options){
        super(options)
    }

    connectedCallback(){
        this.identity = document.querySelector('meta[data-identity]').getAttribute('data-identity')
        this.init()
        this.head.textContent = this.identity + '@' + location.host + ' talking to ' + this.getAttribute('convoMode')
        this.form.setAttribute('pathname', location.pathname)
    }
    
    handleSubmit(event, options = {headless: false}){ // overwrite handleSubmit method of prototype ConvoBlock, to eval first
        event && event.preventDefault()// suppress default action of reloading the page if handleSubmit was called by event listener
        var valueToSubmit = this.input.value || '...'
        var pathnameOnSubmit = location.pathname
        var evalAttempt = this.evalledInWindow(valueToSubmit)  // try to eval submit in window first
        var newBlock = document.createElement('message-block')

        var newProps = {
            input: valueToSubmit,
            headless: options.headless,
            localeval: evalAttempt.goodeval || evalAttempt.localerror,
            pathname: pathnameOnSubmit,
            prompt: this.form.getAttribute('prompt')
        }
        // if there was a localerror, attach action + method properties to prepare block for fetch
        evalAttempt.localerror && (newBlock.props = {
            action: location.pathname + '?' + encodeURI(valueToSubmit),
            method: 'POST'
        })
        this.next.appendChild(newBlock)
        /* have to wait til connectedCallback before attaching properties that mutate HTML */
        newBlock.props = newProps
        this.input.value = '' // reset input to blank (if there's not a keepInput prop on options)
        this.form.setAttribute('pathname', location.pathname)
    }

    evalledInWindow(stringToEval){
        if(stringToEval.indexOf('cd') == 0){
            var newDir = stringToEval.slice(3).trim()

            if(newDir == '.') return { goodeval: 'OK'}
            if(newDir == '..'){
                var newPath = location.pathname.split('/')
                newPath.pop()
                newPath.pop()
                newPath = newPath.join('/') + '/' 
                history.pushState({}, null, newPath)
                return { goodeval: 'OK'}
                //new url is the rest of the string after you slice off the first slash and slice after the second slash
            }
            if(newDir == '~'){
                history.pushState({}, null, '/') 
                return { goodeval: 'OK'}
            }
            if(/[^\\/]/.test(newDir)){
                //if the last character is a black slash or forwardslash, and the first character is not,
                //append the new path to the pathname
                history.pushState({}, null, location.pathname + /[\\/]\$/.test(newDir) ? newDir + '/' : newDir)
                return { goodeval: 'OK'}
            } else if (/^[\\/]/.test(newDir)){
                //if the first character is a slash
                history.pushState({}, null,  /[\\/]\$/.test(newDir) ? newDir  + '/' : newDir)
                return { goodeval: 'OK'}
            }
        }
        if(stringToEval.trim() == 'clear'){
            setTimeout(() => { while (this.next.hasChildNodes()) this.next.removeChild(this.next.lastChild) })
            return { goodeval: 'OK'} // remove all the message blocks AFTER returning 'OK'
        }
        // if it wasn't cd or clear, then eval it as a string
        try {
            var success = eval(stringToEval)
            return { goodeval: typeof success == 'object' ? JSON.stringify(decycle(success),'',4) : String(success)}
        } catch(localerror) {
            return { localerror: localerror.toString()} //errors are objects but can't be parsed by JSON stringify
        }
    }
    // delete this.textArea
}

customElements.define('shell-block', ShellBlock)

function decycle(object) {
    var objects = new WeakMap(); 
    return (function derez(value, path) {
        var old_path;   // The path of an earlier occurance of value
        var nu;         // The new object or array
        if (
            typeof value === "object" && value !== null &&
            !(value instanceof Boolean) &&
            !(value instanceof Date) &&
            !(value instanceof Number) &&
            !(value instanceof RegExp) &&
            !(value instanceof String)
        ) {
            old_path = objects.get(value);
            if (old_path !== undefined) {
                return {$ref: old_path};
            }
            objects.set(value, path);
            if (Array.isArray(value)) {
                nu = [];
                value.forEach(function (element, i) {
                    nu[i] = derez(element, path + "[" + i + "]");
                });
            } else {
                nu = {};
                Object.keys(value).forEach(function (name) {
                    nu[name] = derez(
                        value[name],
                        path + "[" + JSON.stringify(name) + "]"
                    );
                });
            }
            return nu;
        }
        return value;
    }(object, "$"));
};