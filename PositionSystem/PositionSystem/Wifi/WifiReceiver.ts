/// <reference path='../Scripts/typings/mongodb/mongodb.d.ts' />
/// <reference path='../Scripts/typings/express/express.d.ts' />

import express = require('express');
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

	constructor(solver: wifi.PositionSolver, db: mongodb.Db, app: express.Express) {
		this.m_solver = solver;
        this.m_db = db;

        var self = this;
        app.post('/rawWifi', function (req: express.Request, res: express.Response) {
            var macsToUpdate = self.saveRawToDB(req.body, function (macsToUpdate) {
                console.log("Wifi Solving for : " + macsToUpdate.length);
                self.m_solver.solveFor(macsToUpdate);
            });
            res.sendStatus(200);
        });
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