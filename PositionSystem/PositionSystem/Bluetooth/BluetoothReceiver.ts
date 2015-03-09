/// <reference path='../Scripts/typings/express/express.d.ts' />
/// <reference path='../Scripts/typings/body-parser/body-parser.d.ts' />
/// <reference path='../Scripts/typings/mongodb/mongodb.d.ts' />

import express = require('express');
import bodyParser = require('body-parser');
import mongodb = require('mongodb');
import wifi = require('../Wifi/WifiPositionSolver');
import bluetooth = require('../Bluetooth/BluetoothPositionSolver');
import constants = require('../Constants');
import common = require('../Common');

interface RawBluetoothEntry {
	mac: string;
    source: string;
    strength: number;
	time: string;
}

interface RawBluetoothData {
    bluetoothData: RawBluetoothEntry[];
}

export class Receiver {

	private m_db: mongodb.Db;
    private m_solver: bluetooth.PositionSolver;
    private m_app: express.Express;
    private m_stationMacs: string[];

	constructor(solver: bluetooth.PositionSolver, db: mongodb.Db, app: express.Express) {
		this.m_solver = solver;
        this.m_db = db;
        this.m_app = app;
	}

    run(): void {
		var port = 9001;

        this.m_app.use(bodyParser.urlencoded(
			{
				extended: true
			}));
		this.m_app.use(bodyParser.json());

		var self = this;
		this.m_app.post('/rawBluetooth', function (req: express.Request, res: express.Response) {
			var macsToUpdate = self.saveRawToDB(req.body, function (macsToUpdate) {
				self.m_solver.solveFor(macsToUpdate);
			});
			res.sendStatus(200);
        });

        this.m_stationMacs = this.getStationMacs();

		console.log('Gathering Bluetooth Raw Data...');
		this.m_app.listen(port);
	}

    private saveRawToDB(raw: RawBluetoothData, cb: (updatedMacs: string[]) => void): void {
		var updatedMacs: string[] = [];
		var macSet = {};
		var self = this;

        self.m_db.collection(constants.RAW_BLUETOOTH_COLLECTION, function (err: Error, rawBluetoothCollection: mongodb.Collection): void {
			if (err) {
				console.log('Error opening raw Bluetooth DB collection: ' + err);
				return;
			}

			var entries: common.BluetoothEntry[] = [];

            raw.bluetoothData.forEach(function (val, index, array) {
                var entry = new common.BluetoothEntry(val.mac, self.getStationID(val.source), val.strength, val.time);
                entries.push(entry);
                macSet[entry.mac] = entry.mac;
            });

			rawBluetoothCollection.insert(entries, function (error, result) {
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

    //dummy values until we have the bluetooth dongles from lab
    private getStationMacs(): string[] {
        var result: string[] = [];
        result.push('04:1E:64:C7:A2:15');
        result.push('E4:98:D6:63:1D:86');
        return result;
    }

    private getStationID(stationMac: string): number {
        var result = -1;
        this.m_stationMacs.forEach(function (val, index, array) {
            if (val = stationMac) {
                result = index;
            }

        });
        return result;
    }
}