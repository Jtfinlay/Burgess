/// <reference path="Scripts/typings/mongodb/mongodb.d.ts" />

import WifiReceiver = require('./Wifi/WifiReceiver');
import WifiSolver = require('./Wifi/WifiPositionSolver');
import constants = require('./Constants');
import mongo = require('mongodb');

mongo.MongoClient.connect(constants.DB_URL, function (err, db) {
	if (err) {
		console.log("Failed to connect to DB : " + err)
		return;
	}

	var solver = new WifiSolver.PositionSolver(db);

	var wifiRxer = new WifiReceiver.Receiver(solver, db);
	wifiRxer.run();
});

