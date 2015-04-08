/// <reference path='../Scripts/typings/mongodb/mongodb.d.ts' />
/// <reference path='../Scripts/typings/express/express.d.ts' />

import express = require('express');
import mongodb = require('mongodb');
import bluetooth = require('../Bluetooth/BluetoothPositionSolver');
import constants = require('../Constants');
import common = require('../Common');

interface RawBluetoothEntry {
	mac: string;
	source: string;
	strength: number;
	time: string;
}

class StationName {
    constructor(
        public id: string,
        public mac: string) { }
}

export class Receiver {

	private m_db: mongodb.Db;
    private m_solver: bluetooth.PositionSolver;
    private m_btLocDB: mongodb.Db;
    private m_stationList: StationName[];
	
    constructor(solver: bluetooth.PositionSolver, db: mongodb.Db, locationDb: mongodb.Db, app: express.Express) {
		this.m_solver = solver;
        this.m_db = db;
        this.m_btLocDB = locationDb;
        this.m_stationList = [];

        var self = this;

        this.getBluetoothStations(function (station) {
            self.m_stationList.push(station);
        });

		app.post('/rawBluetooth', function (req: express.Request, res: express.Response) {
			self.saveRawToDB(req.body, function (entry) {
				console.log("Bluetooth Solver Solving");
				self.m_solver.solveFor(entry);
			});
			res.sendStatus(200);
        });

        app.get('/bluetoothStations', function (req: express.Request, res: express.Response) {
            res.send(JSON.stringify(self.m_stationList));
        });
	}

	private saveRawToDB(raw: RawBluetoothEntry[], cb: (entry: common.BluetoothEntry) => void): void {
		var entry: common.BluetoothEntry;
		var self = this;

		self.m_db.collection(constants.RAW_BLUETOOTH_COLLECTION, function (err: Error, rawBluetoothCollection: mongodb.Collection): void {
			if (err) {
				console.log('Error opening raw Bluetooth DB collection: ' + err);
				return;
			}

			raw.forEach(function (val, index, array) {
				entry = new common.BluetoothEntry(val.mac, val.source, val.strength, val.time);
			});

			rawBluetoothCollection.insert(entry, function (error, result) {
				if (error) {
					console.log('Error saving entry to DB : ' + error);
				}
			});

			cb(entry);
		});
    }

    private getBluetoothStations(cb: (station: StationName) => void): void {
        var self = this;

        this.m_btLocDB.collection(constants.BLUETOOTHLOCATIONS_COLLECTION, function (err, collection) {
            if (err) {
                console.log('BluetoothLocations::Error opening collection: ' + err);
				return
			}
            collection.find().toArray(function (err, stations) {
                if (err) {
                    console.log('BluetoothLocations::Error iterating over find : ' + err);
						return
					}

                stations.forEach(function (element, index, array) {
                    var station: StationName = new StationName(element.name, element.mac);
                    cb(station);
                });
            });
        });
    }
}