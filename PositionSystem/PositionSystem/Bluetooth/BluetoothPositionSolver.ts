/// <reference path='../Scripts/typings/mongodb/mongodb.d.ts' />

import mongodb = require('mongodb');
import constants = require('../Constants');
import common = require('../Common');

class Station {
	constructor(
		public id: string,
		public point: common.Point) { }
}

export class PositionSolver {

	private m_rawDB: mongodb.Db;
	private m_posDB: mongodb.Db;
	private m_btLocDB: mongodb.Db;

	private m_stations: Station[];

	constructor(rawDB:mongodb.Db, posDB:mongodb.Db, btLocDB:mongodb.Db) {
		this.m_rawDB = rawDB;
		this.m_posDB = posDB;
		this.m_btLocDB = btLocDB;
		this.m_stations = [];

		var self = this;

		this.getBluetoothStations(function (station) {
			self.m_stations.push(station);
		});
	}

	public solveFor(entry: common.BluetoothEntry): void {
		var position: common.PositionEntry;
		var point: common.Point = this.getPoint(entry.stationId);
		
		// Just use the current time, not precise but good enough
		var date = new Date();

		position = new common.PositionEntry(entry.mac, point.x(), point.y(), constants.BT_ERROR, date);

		this.m_posDB.collection(constants.POS_COLLECTION, function (err, collection) {
			if (err) {
				console.log('BluetoothSolver::Error opening position collection: ' + err);
				return
			}
			collection.insert(position, function (error, result) {
				if (error) {
					console.log('Error saving positions to DB : ' + error);
				}
			});
		});
	}

	private getBluetoothStations(cb: (station: Station) => void): void {
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
					var station: Station = new Station(element.name, new common.Point(element.x, element.y));
					cb(station);
				});
			});
		});
	}

	private getPoint(stationID: string): common.Point {
		var result: common.Point;
		this.m_stations.forEach(function (station, index, array) {
			if (station.id == stationID)
				result = station.point;
		});
		return result;
	}
}