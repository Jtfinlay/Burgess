/// <reference path="Scripts/typings/mongodb/mongodb.d.ts" />
/// <reference path='Scripts/typings/express/express.d.ts' />
/// <reference path='Scripts/typings/body-parser/body-parser.d.ts' />

import express = require('express');
import bodyParser = require('body-parser');
import WifiReceiver = require('./Wifi/WifiReceiver');
import BluetoothReciever = require('./Bluetooth/BluetoothReceiver');
import WifiSolver = require('./Wifi/WifiPositionSolver');
import BluetoothSolver = require('./Bluetooth/BluetoothPositionSolver');
import constants = require('./Constants');
import mongo = require('mongodb');

mongo.MongoClient.connect(constants.RAW_DB_URL, function (err, rawDB) {
	if (err) {
		console.log("Failed to connect to raw DB : " + err)
		return;
	}

	mongo.MongoClient.connect(constants.POS_DB_URL, function (err, posDB) {
		if (err) {
			console.log("Failed to connect to position DB : " + err)
			return;
		}

		var port = 9000;
		var app = express();

		app.use(bodyParser.urlencoded(
			{
				extended: true
			}));
		app.use(bodyParser.json());

		var solver = new WifiSolver.PositionSolver(rawDB, posDB);
		var btSolver = new BluetoothSolver.PositionSolver(rawDB, posDB);

		var wifiRxer = new WifiReceiver.Receiver(solver, rawDB, app);
		var bluetoothRxer = new BluetoothReciever.Receiver(btSolver, rawDB, app);

		console.log('Gathering Raw Data...');
		app.listen(port);
	});
});