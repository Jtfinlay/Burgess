#!/bin/bash

if [ "$(id -u)" != "0" ]; then
    echo "Requires root. Please run with sudo!"
    exit 1
fi


if [ $# -eq 0 ]; then
    echo "Please supply an ID as the first parameter to the drone!"
    exit 1
fi

echo "Starting up..."
sudo airmon-ng start wlan0
echo "Running..."
sudo airodump-ng mon0 2>&1 | ./formatter.bash # | ./sender.bash "$1"
#cat dump.txt | ./formatter.bash | ./sender.bash "$1"
