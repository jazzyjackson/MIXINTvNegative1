#!/bin/bash
# Purpose: Create a new user on OSX. Unfortunately there is no builtin script to do so on OSX, like "adduser" for Linux/Unix
# To delete the user: sudo dscl . -delete /Users/<user>
# 	You'll also have to delete the user's home directory

# Author: George Asante, https://github.com/GeorgeKA

if [[ $UID -ne 0 ]]
then 
	printf "Please run $0 as root.\n--------------\n" 
	exit 1 
fi

if [ "$1" == "" ]
then
	printf "Try again\nUsage: adduser <userName>\n--------------\n"
	exit 1
fi
user=$1

echo "Welcome to adduser!!! A simple script to add new users on OSX systems"
echo "--------------"

echo "Enter the user's full name"
read realName
echo ""

echo "Enter the user ID"
echo "(To display all users and IDs: dscl . -list /users UniqueIDgroups)"
read userID
echo ""

echo "Enter the group ID"
echo "(To display all groups and IDs: dscl . -list /groups PrimaryGroupID)"
# group ID conventions: http://serverfault.com/questions/390640/how-are-group-ids-assigned
# admin: 80
# everyone: 12
# staff: 20
read groupID
echo ""

echo "Enter the new password"
read -s passwd
echo ""

echo "Confirm the new password"
read -s passwd2
echo ""

if [ $passwd != $passwd2 ]
then
	printf "Passwords don't match. Exiting...\n--------------\n"
	exit 1
fi

sudo dscl . -create /Users/$user
sudo dscl . -create /Users/$user UserShell /bin/bash
sudo dscl . -create /Users/$user RealName "$realName"
sudo dscl . -create /Users/$user UniqueID "$userID"
sudo dscl . -create /Users/$user PrimaryGroupID $groupID
sudo dscl . -create /Users/$user NFSHomeDirectory /Users/$user
sudo dscl . -passwd /Users/$user $passwd
sudo dscl . -append /Groups/admin GroupMembership $user

sudo mkdir /Users/$user
sudo chown $user /Users/$user

# Remove the "#" to disable automatic sub-directory creation
#<<OptionalDirectories
Directories[0]='Music'
Directories[1]='Documents'
Directories[2]='Downloads'
Directories[3]='Pictures'
Directories[4]='Videos'
#Directories[5]='Desktop'

for i in "${Directories[@]}"
do
	sudo mkdir /Users/$user/$i
done

touch /Users/$user/.bash_profile

sudo chown -R $user /Users/$user
sudo chgrp -R $groupID /Users/$user
#OptionalDirectories

printf "User '$user' created at /Users/$user\n"