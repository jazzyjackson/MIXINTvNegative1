codemirror could be

flip to func
flip to docs

you could name myprogram.py and flip to docs will touch myprogram.py.doc and open 

edit docs this.become(CodeMirrorBlock.from(this.props.filename + .doc))



you could also make docs a sibling or child if you wanted to, a sibling is probably a good choice

make a child this.appendChild(ShowDownBlock.from('this.))
make a sibling this.parentNode.appendChild()