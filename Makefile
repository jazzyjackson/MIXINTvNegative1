# TODO: if there is no chatscript folder, git clone. 
# detect MacChatScript/LinuxChatScript/ChatScript
# ./chatscript/BINARIES/ChatScript buildfiles=./personalities/
# node operator >> ./logs/operator.log &

#create user and group switchboard, add switchboard to admin group, add switchboard to sudoers so it can also adduser and chmod things
# sh adduser switchboard
export DISABLE_SSL      := true
export CHATSCRIPT       := /Users/colton.jackson/utilitybot/chatscript
export POLYROOT         := $(shell pwd)
export SPIDERROOT       := $(POLYROOT)/spiders
export PYTHONPATH       := $(SPIDERROOT)
export PYTHONUNBUFFERED := true
export BOT              := shelly

ifeq ($(shell uname), Darwin)
	# mac has to use scripts that replicate adduser and groupadd functionality
	export ChatScriptExecutable := ChatScript
	export adduser = $(shell pwd)/spiders/basic/adduser-osx.sh
	export groupadd = $(shell pwd)/spiders/basic/groupadd-osx.sh
else
	# else we can use build in adduser and groupadd utilities
	export ChatScriptExecutable := LinuxChatScript64
	export adduser = adduser
	export groupadd = groupadd
endif

default:
	make bootchatscript buildbot nokey

chownership:
	# create operator user and operator group
	# create basic group, add operator, all new users will be added to this group and whatever roles they come with
	# iterate through spiders folder and change ownership to group of same name as folder 
	# sudo $(adduser) 
	chmod +x spiders/basic/interpret.js
	chmod +x ./switchboard.js

yourself-at-home:
	# create user
	# add user to groups
	#all users need to be able to 
	#basic files will be chgroup'd to basic group and chmod'd rwxr-x--- 750,
	#basic directories will be basic group but chmod'd to rwx--x--- 710, files inside can be read, but directory can not be listed
	# basicFiles=figtrees/,gui-blocks/,guidebook/,spiders/basic/,figjam.js,operator.js,readme.markdown,
	#admin files will be chgroup'd to admin group and chmod'd rwxrwx--- 770
	# adminFiles=logs/,personalities/,spiders/*,*
	# $(adduser) = which adduser || spiders/basic/adduser-osx.sh

nokey: 	
	env nokeyok=1 node operator

buildbot: 
	python $(POLYROOT)/spiders/labsdb/makeSpace.py
	cp -r $(POLYROOT)/personalities/* $(CHATSCRIPT)/RAWDATA/
	# send build command to chatscript
	printf ":build $(BOT)" | node spiders/basic/interpret.js

bootchatscript:
	# make ChatScript executable
	chmod +x $(CHATSCRIPT)/BINARIES/$(ChatScriptExecutable)
	# ChatScript should be started from within the chatscript directory, cd into it and then (;) start chatscript in the background (&)
	cd $(CHATSCRIPT)/BINARIES/; ./$(ChatScriptExecutable) userfacts=500 logs=$(POLYROOT)/logs users=$(POLYROOT)/logs VPOLYROOT=$(POLYROOT) &

clean:
	pkill $(ChatScriptExecutable)
	rm logs/*.txt
