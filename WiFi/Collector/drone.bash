#!/bin/bash

if [ "$(id -u)" != "0" ]; then
    echo "Requires root. Please run with sudo!"
    exit 1
fi

echo "Starting up..."
sudo airmon-ng start wlan0
echo "Running..."
sudo airodump-ng mon0 2>&1 | ./formatter.bash | ./sender.bash
#cat dump.txt | ./formatter.bash | ./sender.bash
