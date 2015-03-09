/// <reference path='../Scripts/typings/express/express.d.ts' />
/// <reference path='../Scripts/typings/body-parser/body-parser.d.ts' />
/// <reference path='../Scripts/typings/mongodb/mongodb.d.ts' />

import express = require('express');
import bodyParser = require('body-parser');
import mongodb = require('mongodb');
import wifi = require('./WifiPositionSolver');
import constants = require('../Constants');
import common = require('../Common');

interface RawWifiEntry {
	mac: string;
	strength: number;
	time: string;
}

interface DroneData {
	id: string;
	data: RawWifiEntry[];
}

interface RawWifiData {
	wifiData: DroneData[];
}

export class Receiver {

	private m_db: mongodb.Db;
    private m_solver: wifi.PositionSolver;
    private m_app: express.Express;

	constructor(solver: wifi.PositionSolver, db: mongodb.Db, app: express.Express) {
		this.m_solver = solver;
        this.m_db = db;
        this.m_app = app;
	}

	run(): void {
		var app = express();
		var port = 9000;

		app.use(bodyParser.urlencoded(
			{
				extended: true
			}));
		app.use(bodyParser.json());

		var self = this;
		app.post('/rawWifi', function (req: express.Request, res: express.Response) {
			var macsToUpdate = self.saveRawToDB(req.body, function (macsToUpdate) {
				self.m_solver.solveFor(macsToUpdate);
			});
			res.sendStatus(200);
		});

		console.log('Gathering Wifi Raw Data...');
		app.listen(port);
	}

	private saveRawToDB(raw: RawWifiData, cb: (updatedMacs: string[]) => void): void {
		var updatedMacs: string[] = [];
		var macSet = {};
		var self = this;

		this.m_db.collection(constants.RAW_WIFI_COLLECTION, function (err: Error, rawWifiCollection: mongodb.Collection): void {
			if (err) {
				console.log('Error opening raw Wifi DB collection: ' + err);
				return;
			}

			var entries: common.WifiEntry[] = [];

			raw.wifiData.forEach(function (val, index, array) {
				val.data.forEach(function (rawEntry, idx, arr) {
					var entry = new common.WifiEntry(rawEntry.mac, rawEntry.strength, rawEntry.time, val.id);
					entries.push(entry);
					macSet[entry.mac] = entry.mac;
				});
			});

			rawWifiCollection.insert(entries, function (error, result) {
				if (error) {
					console.log('Error saving entry to DB : ' + error);
				}
			});

			for (var id in macSet) {
				updatedMacs.push(id);
			}

			cb(updatedMacs);
		});
	}
}