/// <reference path="../Scripts/typings/express/express.d.ts" />
/// <reference path="../Scripts/typings/body-parser/body-parser.d.ts" />
/// <reference path="../Scripts/typings/mongodb/mongodb.d.ts" />

import express = require('express');
import bodyParser = require('body-parser');
import mongodb = require('mongodb');
import wifiEntry = require('./WifiEntry');

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
	private m_server: mongodb.Server;

	constructor() {
		this.m_server = new mongodb.Server('localhost', 27017, { auto_reconnect: true })
		this.m_db = new mongodb.Db('raw', this.m_server, { safe:true });
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
			self.saveRawToDB(req.body);
			res.sendStatus(200);
		});

		console.log("Gathering Wifi Raw Data...");
		app.listen(port);
	}

	private saveRawToDB(raw: RawWifiData) {
		this.m_db.open(function (err, db) {
			if (err) {
				console.log("Error opening raw Wifi DB : " + err);
				return;
			}
			db.collection('rawWifi', function (err: Error, rawWifiCollection: mongodb.Collection): void {
				if (err) {
					console.log("Error opening raw Wifi DB collection: " + err);
					return;
				}

				var entries: wifiEntry.WifiEntry[] = [];

				raw.wifiData.forEach(function (val, index, array) {
					val.data.forEach(function (rawEntry, idx, arr) {
						var entry = new wifiEntry.WifiEntry(rawEntry.mac, rawEntry.strength, rawEntry.time, val.id);
						entries.push(entry);
					});
				});

				rawWifiCollection.insert(entries, function (error, result) {
					if (error) {
						console.log("Error saving entry to DB : " + error);
					}
				});
			});

			db.close();
		});
	}
}