# Burgess

## Tier 1

**Wi-Fi signal collection** is handled by a group of drones that are distributed throughout the physical space. Each drone has an AWUS036H wireless adapter, internet connectivity, Airodump-ng tool and the drone scripts. The drone scripts run Airodump-ng, format the output and transmit this output to the ‘Queen’. The Queen is a master drone that receives data from all the drones and aggregates it prior to forwarding it on to Tier 2 for processing.

**Bluetooth metadata collection** is performed by devices running the android application. The devices monitor for any Bluetooth beacons, collect their MAC addresses and signal strength, and then forwards the metadata along to Tier 2 for processing.

### Aircrack-bws Setup
To setup aircrack first make sure you have latest. Then at the root of your repo enter 
```
git submodule init
git submodule update
cd aircrack-bws/aircrack-ng-2.1-rc1
make
```

## Tier 2

**Position system** receives signal data from Tier 1 systems and solves for positions of devices based on the signal metadata. The system classifies customers by a specific priority detailing how long it has been since they have interacted with an employee.

## Tier 3

**Web portal** provides interfacing for the retailer to work with the system. This is the online presentation layer.
```
cd Burgess/Web
bundle install --deployment     # To install gems
rvmsudo rackup                  # To run portal
```

**Android application** provides a live map for employees to see where customers are in real time.

## Tech Stack

* Data Collection
 * [Android](http://developer.android.com/) for Bluetooth tracking and employee map
 * [Aircrack-ng](http://www.aircrack-ng.org/) for Wi-Fi tracking
 * [NodeJS](http://nodejs.org/) for data collection REST server
* Data Processing
 * [TypeScript](http://www.typescriptlang.org/) to process metadata into useful position information
* Web Portal
 * [Sinatra](http://www.sinatrarb.com/) web framework
 * [MongoDB](http://www.mongodb.org) database
 * [Bootstrap](http://getbootstrap.com) based CSS theme
 * [D3.js](http://d3js.org) for visualizations
 * [NVD3.js](http://nvd3.org/) for pretty visualizations
 * [jQuery](http://jquery.com) to make JavaScript easier
 * [KnockOutJS](http://knockoutjs.com/) for data binding
 * [jCanvas](http://calebevans.me/projects/jcanvas/) for canvas drawing
