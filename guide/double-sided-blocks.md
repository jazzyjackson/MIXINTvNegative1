codemirror could be

flip to func
flip to docs
flip to test

programs can have program.py, documentation can include the tests, like on elequent javascript, "Should do this", bash checks the results. (Makes for a good replacement for those code game websites too, hears a description, here's a test, write code that fulfills it)

Source code, a descriptions of what it can or should do, and a bash script markdown mashup. So the presentation layer would just split stright down the first column if it starts with a #. Anything without # is smooshed into a codemirror and demonstrates how to use it, or what happens when its executed.

Also demonstrate how to automate everything. ...

you could name myprogram.py and flip to docs will touch myprogram.py.doc and open 

edit docs this.become(CodeMirrorBlock.from(this.props.filename + .doc))

you could also make docs a sibling or child if you wanted to, a sibling is probably a good choice

make a child this.appendChild(ShowDownBlock.from('this.))
make a sibling this.parentNode.appendChild()
