import wifiReceiver = require('./Wifi/WifiReceiver');

var wifiRxer = new wifiReceiver.Receiver();
wifiRxer.run();