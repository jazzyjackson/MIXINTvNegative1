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
export CHATSCRIPT  := /Users/colton.jackson/utilitybot/chatscript
export cwd         := $(shell pwd)
export BOT         := shelly

UNAME := $(shell uname)
ifeq ($(UNAME), Linux)
export ChatScriptExecutable := LinuxChatScript64
endif
ifeq ($(UNAME), Darwin)
export ChatScriptExecutable := ChatScript
endif

default:
	make bootchatscript buildbot nokey

chownership:
	# create operator user and operator group
	# create basic group, add operator, all new users will be added to this group and whatever roles they come with
	# iterate through spiders folder and change ownership to group of same name as folder 

nokey: 	
	chmod +x ./switchboard.js
	env nokeyok=1 node operator

buildbot:
	cp -r $(cwd)/personalities/* $(CHATSCRIPT)/RAWDATA/
	# send build command to chatscript
	printf '":build $(BOT)"' | node spiders/basic/interpret.js

bootchatscript:
	# make ChatScript executable
	chmod +x $(CHATSCRIPT)/BINARIES/$(ChatScriptExecutable)
	# ChatScript should be started from within the chatscript directory, cd into it and then (;) start chatscript in the background (&)
	cd $(CHATSCRIPT)/BINARIES/; ./$(ChatScriptExecutable) userfacts=500 &
