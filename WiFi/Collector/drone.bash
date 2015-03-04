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
sudo ../../aircrack-bws/aircrack-ng-1.2-rc1/scripts/airmon-ng start wlan1
echo "Running..."
sudo ../../aircrack-bws/aircrack-ng-1.2-rc1/src/airodump-ng mon0 2>&1 | ./formatter.bash | ./sender.bash "$1"
