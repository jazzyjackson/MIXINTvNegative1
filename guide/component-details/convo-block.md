
ConvoShell
A common interface for appending message-blocks to a thread
Message blocks are elements that have various actions attached to attributes.
Message blocks may include metadata describing channel, tags, author. 
For attachments and richer message bodies (code snippets, photo galleries, etc), include a figtree
Figtrees can be popped out (their documnent 'adopted' by a different shadowRoot) anytime. 

----- ideas -----

Oooo, color could represent channel in a thread including all messages (with colored pipes in the background), mouseover one message, collapse messages occuring in others (filter to channel), just one of many playful interfaces for exploring ongoing conversations....

Messages may be encrypted (still new line terminated, made to be 4096 bytes (new line inclusive) exactly)
You have a list of keys, and basically, if you can't JSON parse a line, iterate through the keys until you can parse it, or discard message if you can't discard it, it wasn't meant for you.

---------- old ---------
Provides an input form to submit messages.
Comes with two modes: single player and multi player
Single Player operates much like a shell, where commands can be executed, or addressing the chatbot directly
Multi player is an implementation of a chatroom where all participants in the same directory can post messages to the room. 

On submit, the convo block checks its mode attribute and accordingly:
POSTS message in singple player
Wraps message in context object not to exceed 4096 bytes to allow fast synchronous operation.

{
  dt: Date.now(),
  id: username (on the window, grabbed from response headers of init message),
  txt: message content
  ?prompt: optionally send your prompt icon with you
  ?attachments: references to filenames
  ?style: send a style string to attach to your messages - the form might have a style tab that modifies your view of how your messages look. could just be font-family. could automatically be affected by average amplitude 
}

To edit.... you'll just submit a new message that references the older one. Hm. Yuck. That's append only for ya.

Then it stringifies that and posts it [OBJECT] > .convologs which should immediately write it to disk

In order to receive messages, you need to hold open a long fetch that streams 
tail -f .convologs (needs to close and rehook when changing directories)

Optionally you can choose to pull the last x bytes from the file

When you cd out of a directory, people can see where you went and can follow you, if they have permission

I think there's a way... to poll the server for who is tailing this convo file
yeah for sure
whose reading this convo right now?
these users: ...

So having an event source for users entering and leaving (untailing)
will be useful notification IRC style
I guess people might appreciate if I used IRC protocol
but I don't know that's another piece of software
you can write an IRC client yourself if you want

chatroom block 
chatbot conversations are separate network requests
human conversations are tail streaming, just a subtle difference to signal the nature of the interaction
in human conversations you have to (by default) refer to a bot by name

