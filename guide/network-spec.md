On any website, links can be made to another website by prepending 'http' to the destination. Links can also be made to destinations 'relative' to the current webpage. If you don't include a protocol x://, the current protocol is used, 

location breaks out the different pieces of a url for you, origin, pathname, href and others

if your link starts with a /, the request is made of the ORIGIN of the current location. (origin + your url)
You should use this when a file is being requested from a specific location and you want to ignore what pathname happens to be described by your current url.

Otherwise, you can leave off the slash and the link will be ADDED to href (the host + the path + your url).
However, I like to signal this intent by leading the link with './', the dot says "From Here", signalling that this is intended to be a relative pathname, affected by the current url.

Actions that should be flexible to changes in directory (all the shell commands are made to 'current directory' - and the directory may change, and I want that!) use a .?

# read blocks
read blocks are instantiated with an 'action' attribute, so you have flexibility in what kind of resource is expected.  

in the case of files, where you might open the file, cd around to a different dir, and want to save the file. 