OK
A window manager I haven't seen before
a more intuitive terminal multiplexer for the polymorphic interpreter
with scroll, click and drag resizing, and easy tab / shortcut navigation

Components will have cause to spawn sibling components, and when they do, they should ask the layout manager to create a new panel. 

So you start with a component... maybe its in a proto-split
maybe you have a default for vertical vs horizontal, or maybe it just calcs 

There can be a component called a thread, and its just a flat pack of sibling components
And it just provided a little buffer around each node, provides navigation / scroll within a fixed height, so I can just keep 

convo and shell inherit from block-thread - a container that contains a menu in the head and a bunch of read blocks in the body

RSS threads and 'notebooks' will look like this too.

A container component might include multi-sided-block that just groups arbitrary blocks and lets you spin it around (derivitives can include different animations and shortcuts)

A container component might include use a directory path as a source and grab all text files as sources

A read-block becomes a write-block on-edit. Maybe... have an array of filenames, actually an array of DOM nodes ready to go if you want, they won't load the file until they're appended!

The container can also include the option of what to do for adding content.

convo and shell are obvious

but yeah giant text blocks 
(They may have their own way of handling child components, that's cool too)