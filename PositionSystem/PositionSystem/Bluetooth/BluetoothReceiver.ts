/// <reference path='../Scripts/typings/mongodb/mongodb.d.ts' />
/// <reference path='../Scripts/typings/express/express.d.ts' />

import express = require('express');
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
    private m_stationMacs: any;

	constructor(solver: bluetooth.PositionSolver, db: mongodb.Db, app: express.Express) {
		this.m_solver = solver;
        this.m_db = db;
        this.getStationMacs();

        var self = this;
        app.post('/rawBluetooth', function (req: express.Request, res: express.Response) {
            var macsToUpdate = self.saveRawToDB(req.body, function (macsToUpdate) {
                console.log("Bluetooth Solving for : " + macsToUpdate.length);
                self.m_solver.solveFor(macsToUpdate);
            });
            res.sendStatus(200);
        });
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
    private getStationMacs(): void {
        this.m_stationMacs = {
            '04:1E:64:C7:A2:15': {
                id: 'iPad`', mac: '04:1E:64:C7:A2:15'
            },
            'E4:98:D6:63:1D:86': {
                id: 'iPhone', mac: 'E4:98:D6:63:1D:86'
            }
        }
    }

    private getStationID(stationMac: string): string {
        return this.m_stationMacs[stationMac].id;
    }
}