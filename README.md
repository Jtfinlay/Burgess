# Burgess

Wireless monitoring system designed to track customers through a retail space.

Created by James Finlay, Jesse Tucker, and Tyler Meen for the ECE 493 Capstone Project at the University of Alberta. Graduating class of 2015 from Computer Engineering Software.

Position tracking is a growing technology in retail spaces that is used to provide ads, contextual information, promotions, and other product-focused opportunities. Existing systems use Bluetooth beacons to detect a customers’ phone, determine their position in the store, and provide insight into a nearby product. 

The inspiration for the Burgess Wireless System comes from wanting to shift this product-focused technology into a disruptive customer-focused experience. The problem is simple - how do employees know which customers have been helped? Solving this problem could not only improve in-store customer service, but benefit team performance. By knowing who needs help first, employees can ensure that each customer feels at home and that they are being looked after. This benefits customers, employees, retailers, and brand image.

## How to run

This README contains a description of all the different pieces. This sections describes how to run any of it. There is a Makefile in the root of the project that holds the Linux calls. You may need to run the different parts of the system in different terminals, or run as orphans. Whatever floats your boat.

First, the preprocessing. This runs a NodeJS server that gathers the Bluetooth & WiFi metadata, then parses it into use position data.

```
make preprocessing
```

Next, a Go script that takes the position data and performs aggregation, analytics, and monitors interactions.

```
make postprocessing
```

Finally, the web server to access the live feed, playback, etc.

```
make web_portal
```

Finally, if you want to run tests, you can run them individually or just do a bulk test:

```
make test_go
make test_ruby

or

make test
```

There are some simulator scripts for integration testing, but they are complicated and easier to demo in person.

## Directories 

We were too lazy (and didn't have enough private repos (at the time)) to split these into sub-repos. Enjoy!

**Burgess-EmployeeApp**: contains the Android app for Bluetooth Connection, the Employee Live Map, push notifications, and a placeholder Customer screen. (Tier 1 & Tier 3)

**PositionSystem**: contains *Position-Processing,* which is a fancy NodeJS server that takes the raw Bluetooth/WiFi metadata and turns it into useful position data. (Tier 2)

**Processing**: holds the post position-processing scripts that take accumulated position data, then reformats, archives, and watches for interactions between customers and employees. (Tier 2)

**Web**: Contains web portal including authentication, live feed, playback, analytics, and other management pages. (Tier 3)

**scripts**: additional scripts for integration

## Tier 1

**Wi-Fi signal collection** is handled by a group of drones that are distributed throughout the physical space. Each drone has an AWUS036H wireless adapter, internet connectivity, Airodump-ng tool and the drone scripts. The drone scripts run Airodump-ng, format the output and transmit this output to the ‘Queen’. The Queen is a master drone that receives data from all the drones and aggregates it prior to forwarding it on to Tier 2 for processing.

**Bluetooth metadata collection** is performed by devices running the android application. The devices monitor for any Bluetooth beacons, collect their MAC addresses and signal strength, and then forwards the metadata along to Tier 2 for processing.

### Aircrack-bws Setup
To setup aircrack first make sure you have latest. 

Then follow the instructions at http://www.aircrack-ng.org/doku.php?id=mac80211&DokuWiki=afca843b5c58a99930406b7aa45e2dd2 to install iw. They are at the bottom of the page.

Finally at the root of your repo enter 
```
git submodule init
git submodule update
cd aircrack-bws/aircrack-ng-2.1-rc1
sudo apt-get install libssl-dev
sudo apt-get install libnl-3-dev
sudo apt-get install libnl-genl-3-dev
make
```

## Tier 2

**PositionSystem** receives signal data from Tier 1 systems and solves for positions of devices based on the signal metadata. The system classifies customers by a specific priority detailing how long it has been since they have interacted with an employee.

**Processing** takes the gathered position data from *PositionSystem* and performs post processing on it. It reformats the data to an archived system, manages a customer priority system between employees and customers, and sends push notifications when a customer is in need of help.

## Tier 3

**Web portal** provides interfacing for the retailer to work with the system. This is the online presentation layer.

**Android application** provides a live map for employees to see where customers are in real time.

## Tech Stack

* Data Collection
 * [Android](http://developer.android.com/) for Bluetooth tracking and employee map
 * [Aircrack-ng](http://www.aircrack-ng.org/) for Wi-Fi tracking
 * [NodeJS](http://nodejs.org/) for data collection REST server
* Data Processing
 * [TypeScript](http://www.typescriptlang.org/) to process metadata into useful position information
 * [Go](https://golang.org/) to aggregate position data into simplified results for analytics
 * [Parse](https://www.parse.com/) to manage push notifications on Android and send via REST API
* Web Portal
 * [Sinatra](http://www.sinatrarb.com/) web framework
 * [MongoDB](http://www.mongodb.org) database
 * [Bootstrap](http://getbootstrap.com) based CSS theme
 * [D3.js](http://d3js.org) for visualizations
 * [NVD3.js](http://nvd3.org/) for pretty visualizations
 * [jQuery](http://jquery.com) to make JavaScript easier
 * [KnockOutJS](http://knockoutjs.com/) for data binding
 * [jCanvas](http://calebevans.me/projects/jcanvas/) for canvas drawing
 * [QUnit](https://qunitjs.com/) for JS testing
