menu-block can be stuck into the header of other components.

When it's clicked, it inspects its host's host (its container block) for the "actions" property, .reduce(Object.assign)ing the action properties of each block in its host's prototype chain to create a single graph from which to build the list items of the menu.

When one of the list items is clicked, it replaces itself with a form to submit options the next time it's clicked. 

When a pre-activated list item is clicked, it invokes the attached function and destroys the menu list.

If an unactivated list item is clicked, the pre-activated replacing itself with the unactivated original.

"Escape" destoys the menu
Focusing another element within the host destroys the menu

Focusing on another block and/or opening another blocks menu does not destory the menu, so you can open more than one menu at a time. I might change my mind on this but I kinda like it.



