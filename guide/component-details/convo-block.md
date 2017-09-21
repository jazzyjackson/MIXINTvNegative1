Provides an input form to submit messages.
Comes with two modes: single player and multi player
Single Player operates much like a shell, where commands can be executed, or addressing the chatbot directly
Multi player is an implementation of a chatroom where all participants in the same directory can post messages to the room. 

On submit, the convo block checks its mode attribute and accordingly:
POSTS message in singple player
Wraps message in context object not to exceed 512 bytes to allow fast synchronous operation

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

chatroom block 
chatbot conversations are separate network requests
human conversations are tail streaming, just a subtle difference to signal the nature of the interaction
in human conversations you have to (by default) refer to a bot by name

