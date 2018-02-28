## reactions
### ['src']

if library block was initialized with a src that didn't end in a slash, find the index of the last slash and slice everything else off, set the source property so this function gets called again with updated source
/docs/utilities.csv becomes /docs/


else, source looks like a directory, so
- set a new lastUpdate
- update the header title
- remove any children of file list

call fetchFileList with the source then generateIcons.

you may overwrite  the fetchFileList method
just pay attention to what generateIcons expects right now. to use output of ls -api1, I expect new line terminated pairs of inode + filename with a trailing slash to indicate directory or not maybe ideally you would feed it an array of objects...

## fetchFileList
kvetch.post(this.props.src/ls?args=-api1)
-> plain text of file list

-a list all in directory(. and ..)
-p if file is directory add trailing slash
-l treat links to directories as directories, or is this -d on ubuntu?
-1 one file per line 
-i print inode first

## fetchFileDe
kvetch.options(this.props.src + title)
-> json object of file stats