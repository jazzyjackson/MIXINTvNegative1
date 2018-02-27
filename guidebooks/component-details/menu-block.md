menu-block can be stuck into the header of other components.

When it's clicked, it inspects its host's host (its container block) for the "actions" property, .reduce(Object.assign)ing the action properties of each block in its host's prototype chain to create a single graph from which to build the list items of the menu.

When one of the list items is clicked, it replaces itself with a form to submit options the next time it's clicked. 

When a pre-activated list item is clicked, it invokes the attached function and destroys the menu list.

If an unactivated list item is clicked, the pre-activated replacing itself with the unactivated original.

"Escape" destoys the menu
Focusing another element within the host destroys the menu

Focusing on another block and/or opening another blocks menu does not destory the menu, so you can open more than one menu at a time. I might change my mind on this but I kinda like it.

To achieve the expanding animation of the menu, I have a css transition on the height of the UL
The UL sets its overflow to hidden

------------ implementation -------------

menu-block attaches its style to its shadowRoot

provides methods `makeMenu` and `destroyMenu` which perform top level construction/deconstruction of the UL and LI subelements

But there has to be an abstraction already to create th

-----------------

so, certain style applies just to :host-context(header-block)

and if its not header-block, you get insertSibling, become...

how about proto is the same...
if a block has no template... maybe use MenuBlock instead? why not?

try {
    
}

if there's an error... insert that footer too so there's a place for error messages to hide...



