class CodemirrorBlock extends TextareaBlock {
    constructor(props){
        super(props)

        this.defaultCodeMirror = {
            lineNumbers: true,
            // if whitespace value is "wrap" set lineWrapping to true, else lineWrapping is false (default)
            lineWrapping: this.getAttribute('whitespace') == 'wrap',
        }
    }

    static get actions(){
        return [
            {"set language": {
                func: HTMLElement.prototype.setAttribute,
                args: [{label: "mode"}, {select: ["apl","asciiarmor","asn.1","asterisk","brainfuck","clike","clojure","cmake","cobol","coffeescript","commonlisp","crystal","css","cypher","d","dart","diff","django","dockerfile","dtd","dylan","ebnf","ecl","eiffel","elm","erlang","factor","fcl","forth","fortran","gas","gfm","gherkin","go","groovy","haml","handlebars","haskell","haskell-literate","haxe","htmlembedded","htmlmixed","http","idl","javascript","jinja2","jsx","julia","livescript","lua","markdown","mathematica","mbox","meta.js","mirc","mllike","modelica","mscgen","mumps","nginx","nsis","ntriples","null","octave","oz","pascal","pegjs","perl","php","pig","powershell","properties","protobuf","pug","puppet","python","q","r","rpm","rst","ruby","rust","sas","sass","scheme","shell","sieve","slim","smalltalk","smarty","solr","soy","sparql","spreadsheet","sql","stex","stylus","swift","tcl","textile","tiddlywiki","tiki","toml","tornado","troff","ttcn","ttcn-cfg","turtle","twig","vb","vbscript","velocity","verilog","vhdl","vue","webidl","xml","xquery","yacas","yaml","yaml-frontmatter","z80"]}],
                default: [null, ctx => ctx.props.mode || "null"]
            }},
            {"set colorscheme": {
                func: HTMLElement.prototype.setAttribute,
                args: [{label: "theme"}, {select: ["3024-day", "3024-night", "abcdef", "ambiance", "ambiance-mobile", "base16-dark", "base16-light", "bespin", "blackboard", "cobalt", "colorforth", "default", "dracula", "eclipse", "elegant", "erlang-dark", "hopscotch", "icecoder", "isotope", "lesser-dark", "liquibyte", "material", "mbo", "mdn-like", "midnight", "monokai", "neat", "neo", "night", "panda-syntax", "paraiso-dark", "paraiso-light", "pastel-on-dark", "railscasts", "rubyblue", "seti", "solarized", "the-matrix", "tomorrow-night-bright", "tomorrow-night-eighties", "ttcn", "twilight", "vibrant-ink", "xq-dark", "xq-light", "yeti", "zenburn"]}],            
                default: [null, ctx => ctx.props.theme || "default"]                
            }},
            {"set keymap": {
                func: HTMLElement.prototype.setAttribute,
                args: [{label: "keymap"}, {select: ["default","vim","sublime", "emacs"]}],
                default: [null, ctx => ctx.props.keymap || "vim"]
            }}
        ]
    }

    static get reactions(){
        return [
            {
                watch: ['mode','theme','keymap'],
                react: function(attributeName, oldValue, newValue){
                    // invoke setter method on this to modify CodeMirror, stash the preference in localStorage
                    if(newValue == oldValue) return null // nothing needs to be done
                    else this[attributeName] = localStorage[attributeName] = newValue 
                }
            },{
                watch: ['whitespace'],
                react: function(attributeName, oldValue, newValue){
                    // lineWrapping option is true or false, so compare newValue to 'wrap' to Booleanize it
                    if(!this.cm) return null // cm ain't there yet, whitespace will be set on connectedCallback
                    else this.cm && this.cm.setOption("lineWrapping", newValue == "wrap")
                }
            }
        ]
    }

    static build(){    
        // this promise will resolve immediately if the script is already available
        this.loadLocalStyle(env.APP_HOME + '/gui-blocks/codemirror/assets/lib/codemirror.css')
        .then(()=> this.attachGlobalScript(env.APP_HOME + '/gui-blocks/codemirror/assets/lib/codemirror.js'))
        // that script makes CodeMirror a global, preferredTheme and KeyMap will be preserved. maybe I'll stash them in localStorage
        // then determine file type and attach appropriate script
        // if there's a colorscheme attribute load that too 
        .then(()=>{
            this.cm = CodeMirror.fromTextArea(this.child['textarea'], this.defaultCodeMirror)
            this.theme = this.props.theme || localStorage.theme || "monokai"
            this.keymap = this.props.keymap || localStorage.keymap || "default"
            // cm.save commits the editor contents into this.data (this.child['textarea']) which is referenced for file overwrite and so on.
            this.cm.on('blur', () => this.cm.save())
            return this.attachGlobalScript(env.APP_HOME + '/gui-blocks/codemirror/assets/mode/meta.js')
        })
        .then(()=>{
            this.mode = this.props.mode || CodeMirror.findModeByFileName(this.props.src).mode        
        })
    }

    set keymap(newMap){
        if(!this.cm) return null
        this.props.keymap = newMap
        
        if(newMap == 'default') this.cm.setOption('keyMap', newMap)        
        else this.attachGlobalScript(`${env.APP_HOME}/gui-blocks/codemirror/assets/keymap/${newMap}.js`)
            .then(()=> this.cm.setOption('keyMap', newMap))
    }

    set mode(newMode){
        if(!this.cm) return null        
        this.props.mode = newMode // you can call this directly, then we need to set attribute again, which will call the attributeChangeCallback, which will exit when there's no redundant value change

        if(newMode == 'null') this.cm.setOption('mode', newMode)
        else this.fetchModePrerequisites(newMode)
            .then(()=> this.cm.setOption('mode', newMode))
            .catch(this.errorMsg)
    }

    set theme(newTheme){
        if(!this.cm) return null        
        this.setAttribute('theme', newTheme)
        localStorage.preferredTheme = newTheme
        if(newTheme == 'default') return this.cm.setOption('theme', newTheme)     
        else this.loadLocalStyle(`${env.APP_HOME}/gui-blocks/codemirror/assets/theme/${newTheme}.css`)
            .then(()=> this.cm.setOption('theme', newTheme))
    }

    fetchModePrerequisites(newMode){
        let attachmode = mode => this.attachGlobalScript(`${env.APP_HOME}/gui-blocks/codemirror/assets/mode/${mode}/${mode}.js`)
        if (newMode == 'htmlmixed'){
            return Promise.all([attachmode('javascript'), 
                                attachmode('css'), 
                                attachmode('xml')])
                          .then(()=> attachmode('htmlmixed'))
        } else {
            return attachmode(newMode)
        }
    }
}