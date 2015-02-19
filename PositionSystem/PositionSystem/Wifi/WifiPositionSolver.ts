/// <reference path="../Scripts/typings/mongodb/mongodb.d.ts" />

import mongodb = require('mongodb');
import constants = require('../Constants');

export class WifiEntry {
	constructor(
		public mac: string,
		public strength: number,
		public time: string,
		public stationId: string) {

	}
}

interface Station {
	id: string;
	x: number;
	y: number;
}

export class PositionSolver {

	private m_db: mongodb.Db;

	constructor(db:mongodb.Db) {
		this.m_db = db;
	}

	public solveFor(macIds: string[]): void {
		var self = this;
		macIds.forEach(function (mac, index, arr) {
			self.getLatestAtEachStationForId(mac, function (latestEntries) {
				self.CalculatePosition(mac, latestEntries);
			});;
		});
	}

	private getLatestAtEachStationForId(targetMac: string, cb: (entry: WifiEntry[]) => void): void {
		var entries: WifiEntry[] = [];
		var stationMap = {};
		var self = this;

		this.m_db.collection(constants.RAW_WIFI_COLLECTION, function (err, collection) {
			if (err) {
				console.log("WifiPositionSolver::Error opening collection : " + err);
				return
			}

			collection.find({ mac: targetMac }, function (err, cursor) {
				cursor.each(function (err, entry: WifiEntry) {
					if (err) {
						console.log("WifiPositionSolver::Error iterating over find : " + err);
						return;
					}
					if (entry != null) {
						if (stationMap[entry.stationId]) {
							var currentEntry = <WifiEntry>stationMap[entry.stationId];
							var curDate = new Date(currentEntry.time);
							var newDate = new Date(entry.time);
							if (newDate > curDate) {
								stationMap[entry.stationId] = entry;
							}
						}
						else {
							stationMap[entry.stationId] = entry;
						}
					}
					else {
						for (var stationId in stationMap) {
							entries.push(stationMap[stationId]);
						}

						cb(entries);
					}
				});
			});
		});
	}

	private CalculatePosition(mac: String, latestEntries: WifiEntry[]) {

	}
}