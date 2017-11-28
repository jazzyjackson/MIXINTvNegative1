class CodemirrorBlock extends TextareaBlock {
  constructor(props){
      super(props)
      // this load will fire when the fetch for the file (in src attribute) completes
      this.addEventListener('load', () => {
        console.log("PROPS", this.props)
        
          // this promise will resolve immediately if the script is already available
            this.loadLocalStyle('/gui-blocks/codemirror/assets/lib/codemirror.css')
            .then(()=> this.attachGlobalScript('/gui-blocks/codemirror/assets/lib/codemirror.js'))
            // then determine file type and attach appropriate script
            // if there's a colorscheme attribute load that too 
            .then(()=>{
                this.cm = CodeMirror.fromTextArea(this.child['textarea'], {
                    lineNumbers: true,
                     // if whitespace value is "wrap" set lineWrapping to true, else lineWrapping is false (default)
                    lineWrapping: this.getAttribute('whitespace') == 'wrap',
                })
                this.theme = this.getAttribute('theme') || CodeMirror.preferredTheme || "monokai"
                this.keymap = this.getAttribute('keymap') || CodeMirror.preferredKeyMap || "default"
                // retrigger attributechangedcallback after loading codemirror
                // cm.save commits the editor contents into this.data (this.child['textarea']) which is referenced for file overwrite and so on.
                this.cm.on('blur', () => {
                    this.cm.save()
                })
                return this.attachGlobalScript('/gui-blocks/codemirror/assets/mode/meta.js')
            })
            .then(()=>{
                this.mode = this.getAttribute('mode') || CodeMirror.findModeByFileName(this.props.src).mode        
            })
        })
    }

    static get actions(){
        return [
            {"set language": {
                func: HTMLElement.prototype.setAttribute,
                args: [{label: "mode"}, {select: ["apl","asciiarmor","asn.1","asterisk","brainfuck","clike","clojure","cmake","cobol","coffeescript","commonlisp","crystal","css","cypher","d","dart","diff","django","dockerfile","dtd","dylan","ebnf","ecl","eiffel","elm","erlang","factor","fcl","forth","fortran","gas","gfm","gherkin","go","groovy","haml","handlebars","haskell","haskell-literate","haxe","htmlembedded","htmlmixed","http","idl","javascript","jinja2","jsx","julia","livescript","lua","markdown","mathematica","mbox","meta.js","mirc","mllike","modelica","mscgen","mumps","nginx","nsis","ntriples","null","octave","oz","pascal","pegjs","perl","php","pig","powershell","properties","protobuf","pug","puppet","python","q","r","rpm","rst","ruby","rust","sas","sass","scheme","shell","sieve","slim","smalltalk","smarty","solr","soy","sparql","spreadsheet","sql","stex","stylus","swift","tcl","textile","tiddlywiki","tiki","toml","tornado","troff","ttcn","ttcn-cfg","turtle","twig","vb","vbscript","velocity","verilog","vhdl","vue","webidl","xml","xquery","yacas","yaml","yaml-frontmatter","z80"]}],
                default: [()=>"mode", ctx => ctx.getAttribute('mode') || "null"]
            }},
            {"set colorscheme": {
                func: HTMLElement.prototype.setAttribute,
                args: [{label: "theme"}, {select: ["3024-day", "3024-night", "abcdef", "ambiance", "ambiance-mobile", "base16-dark", "base16-light", "bespin", "blackboard", "cobalt", "colorforth", "default", "dracula", "eclipse", "elegant", "erlang-dark", "hopscotch", "icecoder", "isotope", "lesser-dark", "liquibyte", "material", "mbo", "mdn-like", "midnight", "monokai", "neat", "neo", "night", "panda-syntax", "paraiso-dark", "paraiso-light", "pastel-on-dark", "railscasts", "rubyblue", "seti", "solarized", "the-matrix", "tomorrow-night-bright", "tomorrow-night-eighties", "ttcn", "twilight", "vibrant-ink", "xq-dark", "xq-light", "yeti", "zenburn"]}],            
                default: [()=>"theme", ctx => ctx.getAttribute('theme') || "default"]                
            }},
            {"set keymap": {
                func: HTMLElement.prototype.setAttribute,
                args: [{label: "keymap"}, {select: ["default","vim","sublime", "emacs"]}],
                default: [()=>"keymap", ctx => ctx.getAttribute('keymap') || "vim"]
            }}
        ]
    }

    // on set src you should check mode again
    // so if you make a new .txt, write some code, and save it as .py, colors will follow
    static get observedAttributes(){
        return ["mode","theme", "keymap","whitespace"]
    }

    attributeChangedCallback(attr, oldValue, newValue){
        if(oldValue==newValue) return "Nothing needs to be done"
        switch(attr){
            case "mode": this.mode = newValue; break;
            case "theme": this.theme = newValue; break;
            case "keymap": this.keymap = newValue; break;
            // if whitespace new value is "wrap" set lineWrapping to true, else lineWrapping is false (default)
            case "whitespace": this.cm && this.cm.setOption("lineWrapping", newValue == "wrap"); break;
        }
    }

    set keymap(newMap){
        if(!this.cm) return null
        this.setAttribute('keymap', newMap)
        CodeMirror.preferredKeyMap = newMap
        if(newMap == 'default') this.cm.setOption('keyMap', newMap)        
        else this.attachGlobalScript(`/gui-blocks/codemirror/assets/keymap/${newMap}.js`)
            .then(()=> this.cm.setOption('keyMap', newMap))
    }

    set mode(newMode){
        if(!this.cm) return null        
        this.setAttribute('mode', newMode)        
        if(newMode == 'null') this.cm.setOption('mode', newMode)
        else this.fetchModePrerequisites(newMode)
            .then(()=> this.cm.setOption('mode', newMode))
    }

    set theme(newTheme){
        if(!this.cm) return null        
        this.setAttribute('theme', newTheme)
        CodeMirror.preferredTheme = newTheme
        if(newTheme == 'default') return this.cm.setOption('theme', newTheme)     
        else this.loadLocalStyle(`/gui-blocks/codemirror/assets/theme/${newTheme}.css`)
            .then(()=> this.cm.setOption('theme', newTheme))
    }

    fetchModePrerequisites(newMode){
        let attachmode = mode => this.attachGlobalScript(`/gui-blocks/codemirror/assets/mode/${mode}/${mode}.js`)
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