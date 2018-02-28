export nokeyok := 1 # for now
export PORT := 3000

install:
	sudo chmod +x ./switchboard.js
	git submodule init
	git submodule update
	cd gui-blocks/codemirror/assets && npm i && npm build
	# should probably link local node_modules with global modules
	# add operator to path until I can make the service start / pause / stop business
	# link stuff to /usr/share, /usr/lib and so on so operator can be used anywhere
	# would be very cool if HOME directory in switchboard environment is whereever you started it
	# convenient, "start an operator here" menu option, now everything is on the local net! dream come true

docker:
	docker build --tag mixint:debian .

docker-run:
	docker run -p 3000:3000 -p 4444:4444 mixint:debian

docker-live:
	# -v is 'mount volume' to reflect live changes to gui-blocks and
	docker rm $(shell docker ps -a -q) || true
	docker run -p 3000:3000 -p 4444:4444 -it \
	-v $(shell pwd)/gui-blocks/:/opt/mixint/gui-blocks/:ro \
	-v $(shell pwd)/spiders/:/opt/mixint/spiders/:ro \
	mixint:debian /bin/bash

docker-clean:
	# I guess this might not work if the stop command exits on a container that is already stopped, and fails to stop subsequent containers...
	docker stop $(shell docker ps -a -q) || true
	docker rm $(shell docker ps -a -q) || true
	docker rmi `docker images -f "dangling=true" -q`

yourself-at-home:
	printf everyone,$(groups) | xargs -d ',' -n 1 groupadd -f # take comma seperated list of groups and make sure they exist
	# check if user exists, if not, add them as member of their own group
	id -u $(identity) || useradd --comment $(fullname) $(identity) # /etc/login.defs has "USERGROUPS_ENAB yes" so user will get a group with their own name
	# set groups according to groups property on request
	# this should correspond with 'roles' array from auth server
	# if you need to update this property, kill that users switchboard (TODO: window on leave could send disconnect POST?)
	# next time make yourself-at-home is run their groups are updated
	usermod -G everyone,$(groups) $(identity) || true ### groups $(identity) to find which groups identity is a member of
	# mkdir -p id/$(fullname)
	# ln -s Readme.markdown id/$(fullname)/Readme.markdown || :
	# chown $(identity):$(identity) id/$(fullname)
	# chmod 770 id/$(fullname) # umask??