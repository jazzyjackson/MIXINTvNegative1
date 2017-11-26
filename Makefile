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


mini: 
	echo "to run without downloading anything else, total size < 1MB"
medium:
	echo "to download useful external projects: showdown for rendering markdown files, codemirror for editing code, papa parse for working with csv and tabular data. Less than 10MB."
max:
	# look in current directory for chatscript
	# look one directory up for chatscript
