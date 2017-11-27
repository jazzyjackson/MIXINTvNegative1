# if there is no chatscript folder, git clone. 
# detect MacChatScript/LinuxChatScript/ChatScript
# ./chatscript/BINARIES/ChatScript buildfiles=./personalities/
# node operator >> ./logs/operator.log &

#all users need to be able to 
#basic files will be chgroup'd to basic group and chmod'd rwxr-x--- 750,
#basic directories will be basic group but chmod'd to rwx--x--- 710, files inside can be read, but directory can not be listed
# basicFiles=figtrees/,gui-blocks/,guidebook/,spiders/basic/,figjam.js,operator.js,readme.markdown,
#admin files will be chgroup'd to admin group and chmod'd rwxrwx--- 770
# adminFiles=logs/,personalities/,spiders/*,*
# $(adduser) = which adduser || spiders/basic/adduser-osx.sh

#create user and group switchboard, add switchboard to admin group, add switchboard to sudoers so it can also adduser and chmod things
# sh adduser switchboard
export DISABLE_SSL := true

nokey: 
	chmod +x ./switchboard.js
	env nokeyok=1 node operator
