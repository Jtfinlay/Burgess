/// <reference path="Scripts/typings/mongodb/mongodb.d.ts" />

import WifiReceiver = require('./Wifi/WifiReceiver');
import WifiSolver = require('./Wifi/WifiPositionSolver');
import constants = require('./Constants');
import mongo = require('mongodb');

mongo.MongoClient.connect(constants.RAW_DB_URL, function (err, rawDB) {
	if (err) {
		console.log("Failed to connect to raw DB : " + err)
		return;
	}

	mongo.MongoClient.connect(constants.POS_DB_URL, function (err, posDB) {
		if (err) {
			console.log("Failed to connect to raw DB : " + err)
			return;
		}

		var solver = new WifiSolver.PositionSolver(rawDB, posDB);

		var wifiRxer = new WifiReceiver.Receiver(solver, rawDB);
		wifiRxer.run();
	});
});

