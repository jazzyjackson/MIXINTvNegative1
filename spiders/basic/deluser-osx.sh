#!/bin/bash
# Purpose: Delete a user on OSX. Unfortunately there is no builtin script to do so on OSX, like "deluser" for Linux/Unix

# Author: George Asante, https://github.com/GeorgeKA

if [[ $UID -ne 0 ]]
then
    printf "Please run $0 as root.\n--------------\n"
    exit 1
fi

if [ "$1" == "" ]
then
    printf "Try again\nUsage: deluser <userName>\n--------------\n"
    exit 1
fi
user=$1

sudo dscl . -delete /Users/$user

if [ -d /Users/$user ]
then
    sudo rm -rf /Users/$user
fi
    printf "$user removed\n--------------\n"