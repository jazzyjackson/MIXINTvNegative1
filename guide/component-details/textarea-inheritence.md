a node on

textarea
table
codemirror

and other components that expect to use the overwrite file operation from textarea-block

I like the thing codemirror has going, in which at anytime you can call a function to stash the current data back into a textarea, from which you can read textarea.textContent

So I'm enforcing this as a common interface

table and codemirror inherit 'overwrite' which calls 'this.data'
so whenever you change the data displayed, make sure you update the underlying, hidden textarea
cuz that's the data that'll be written to disk