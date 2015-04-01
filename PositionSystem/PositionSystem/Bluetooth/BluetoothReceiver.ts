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

export class Receiver {

	private m_db: mongodb.Db;
	private m_solver: bluetooth.PositionSolver;
	
	constructor(solver: bluetooth.PositionSolver, db: mongodb.Db, app: express.Express) {
		this.m_solver = solver;
		this.m_db = db;

		var self = this;
		app.post('/rawBluetooth', function (req: express.Request, res: express.Response) {
			self.saveRawToDB(req.body, function (entry) {
				console.log("Bluetooth Solver Solving");
				self.m_solver.solveFor(entry);
			});
			res.sendStatus(200);
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
}