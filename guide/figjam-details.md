The dependency tree of available components is just a graph of names - src is optional and defaults to the local gui-blocks directory. Could be external server, github etc.

If a folder doesn't include a template.html, it isn't registered to a custom component, and it doesn't become a valid option in the become block, it's instead rendered as a dependency.

Since dependencies are registered in order, if the child of a component is defined before its parent, it's garunteed that the parent is not a registerable component.