#/bin/bash

if [ "$(id -u)" != "0" ]; then
    echo "Please run as root!"
    exit 1
fi

if [ $# -eq 0 ];then
    echo "Please supply an ID as hte first parameter to the drone!"
    exit 1
fi

echo "Building..."
tsc --module commonjs --outdir ./Drone/Drone/js-bin --removeComments -t ES5 ./Drone/Drone/app.ts

echo "Starting up..."
../../aircrack-bws/aircrack-ng-1.2-rc1/scripts/airmon-ng start wlan1
#../../aircrack-bws/aircrack-ng-1.2-rc1/scripts/airmon-ng check kill

echo "Running..."
sudo ../../aircrack-bws/aircrack-ng-1.2-rc1/src/airodump-ng mon0 | node ./Drone/Drone/js-bin/app.js "$1"
