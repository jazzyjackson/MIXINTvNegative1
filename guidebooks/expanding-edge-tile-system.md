OK
A window manager I haven't seen before
a more intuitive terminal multiplexer for the polymorphic interpreter
with scroll, click and drag resizing, and easy tab / shortcut navigation

Components will have cause to spawn sibling components, and when they do, they should ask the layout manager to create a new panel. 

So you start with a component... maybe its in a proto-split
maybe you have a default for vertical vs horizontal, or maybe it just calcs 

There can be a component called a thread, and its just a flat pack of sibling components
And it just provided a little buffer around each node, provides navigation / scroll within a fixed height, so I can just keep 

A thread block is just another windowing system - describes the visual layout of a tree of nodes (or maybe just the top layer - I can't change the style inside child blocks).

So a thread-block (whether single layer or nested, but nested blocks must be able to recursively present themselves - a comment inside a comment and so on) lays out a tree of nodes in a very non-rearrangeable way.

A multiplexer-block can provide splits and tab
A window-block can provide click and dragability
A graph-block can provide draggability with visual presentation of the tree (edges connecting the blocks/nodes)
A infinity-block can extend multiplexer to give shortcuts to pan and zoom across large multiplexed windows.

window blocks can be nested inside multiplexer blocks and so on
really wild stuff

Blocks expand to fill their container.

convo and shell inherit from thread-block - a container that contains a menu in the head and a bunch of read blocks in the body

RSS threads and 'notebooks' will look like this too.

A container component might include multi-sided-block that just groups arbitrary blocks and lets you spin it around (derivitives can include different animations and shortcuts)

A container component might include use a directory path as a source and grab all text files as sources

A read-block becomes a write-block on-edit. Maybe... have an array of filenames, actually an array of DOM nodes ready to go if you want, they won't load the file until they're appended!

The container can also include the option of what to do for adding content.

convo and shell are obvious

but yeah giant text blocks 
(They may have their own way of handling child components, that's cool too)

multiplexer should allow submodules to enter fullscreen (Hey I can add functions to all classes huh. or just. proto-block.prototype.actions etc)

https://manu.ninja/webgl-3d-model-viewer-using-three-js

anyway enter fullscreen
escape returns

just easy stuff


