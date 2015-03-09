/// <reference path='../Scripts/typings/mongodb/mongodb.d.ts' />

import mongodb = require('mongodb');
import constants = require('../Constants');
import common = require('../Common');

interface EntryPair {
	first: common.BluetoothEntry;
	second: common.BluetoothEntry;
}

interface Station {
	id: string;
	point:common.Point;
}

export class PositionSolver {

	private m_rawDB: mongodb.Db;
	private m_posDB: mongodb.Db;

	private m_stations:any;

	constructor(rawDB:mongodb.Db, posDB:mongodb.Db) {
		this.m_rawDB = rawDB;
		this.m_posDB = posDB;

		// TODO::JT store this in DB and retrieve. Just hacking together for the time being
		this.m_stations = {
			'vm-drone': {
				id: 'vm-drone', point: new common.Point(0, 0)
			},
			'vm-drone2': {
				id: 'vm-drone2', point: new common.Point(0, 15)
			},
			'vm-drone3': {
				id: 'vm-drone3', point: new common.Point(25, 0)
			}
		}
	}

	public solveFor(macIds: string[]): void {
		var self = this;

		var count = 0;
		var positions: common.PositionEntry[] = [];
		macIds.forEach(function (mac, index, arr) {
			self.getLatestAtEachStationForId(mac, function (latestEntries) {
				var pos = self.CalculatePosition(mac, latestEntries);
				
				if (pos != null) {
					if(isNaN(pos.x) || isNaN(pos.y)) {
						console.log('Logic error, pos contains NaN : ' + JSON.stringify(pos));
					}
					else {
						positions.push(pos);
					}
				}

				// doing this stupid stateful thing to avoid more callback hell
				++count;
				if (count == macIds.length) {
					self.StorePositions(positions);
				}
			});;
		});
	}

	private getLatestAtEachStationForId(targetMac: string, cb: (entry: common.BluetoothEntry[]) => void): void {
		var entries: common.BluetoothEntry[] = [];
		var stationMap = {};
		var self = this;

		this.m_rawDB.collection(constants.RAW_BLUETOOTH_COLLECTION, function (err, collection) {
			if (err) {
				console.log('PositionSolver::Error opening collection : ' + err);
				return
			}

			collection.find({ mac: targetMac }, function (err, cursor) {
				cursor.each(function (err, entry: common.BluetoothEntry) {
					if (err) {
						console.log('PositionSolver::Error iterating over find : ' + err);
						return;
					}
					if (entry != null) {
						if (stationMap[entry.stationId]) {
							var currentEntry = <common.BluetoothEntry>stationMap[entry.stationId];
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

	private StorePositions(positions: common.PositionEntry[]): void{
		if (positions.length == 0) {
			return;
		}
		this.m_posDB.collection(constants.POS_COLLECTION, function (err, collection) {
			if (err) {
				console.log('Unable to get position collection : ' + err);
				return;
			}

			collection.insert(positions, function (error, result) {
				if (error) {
					console.log('Error inserting positions into DB : ' + error);
				}
			});
		});
	}

	private CalculatePosition(mac: string, latestEntries: common.BluetoothEntry[]):common.PositionEntry {
		// can't perform trilateration without at least 3 measurements
		var result:common.PositionEntry = null;
		if (latestEntries.length >= 3) {
			var pairs = this.GenerateStationPairs(latestEntries);
			var points = this.DeterminePoints(pairs, latestEntries);
			var pos = this.AveragePoints(points);
			var uncertainty = this.CalcStdDeviation(pos, points);

			result = new common.PositionEntry(mac, pos.x(), pos.y(), uncertainty, new Date(), "");
		}

		return result;
	}

	private AveragePoints(points:common.Point[]):common.Point {
		var x: number = 0;
		var y: number = 0;
		points.forEach(function (point, idx, arr) {
			x += point.x();
			y += point.y();
		});

		return new common.Point(x / points.length, y / points.length);
	}

	private CalcStdDeviation(meanPoint:common.Point, points:common.Point[]): number {
		var deltasSqrd: number[] = [];
		points.forEach(function (p, idx, arr) {
			var delta = meanPoint.SubtractVector(p).Magnitude();
			deltasSqrd.push(delta * delta); // strictly speaking there is a minus zero here
		});

		var total = 0;
		deltasSqrd.forEach(function (delta, idx, arr) {
			total += delta;
		});

		return Math.sqrt(total / points.length);
	}

	private DeterminePoints(pairs:EntryPair[], entries:common.BluetoothEntry[]):common.Point[] {
		var result:common.Point[] = [];
		var self = this;

		pairs.forEach(function (pair, index, arr) {
			var p = self.DeterminePoint(pair, entries);
			if (p != null) {
				result.push(p);
			}
		});

		return result;
	}

	///
	//	Free Space Path Loss Equation. dbm is in dBm and result is in meters.
	//	Expected range of input is about -75 to -45 and expected output is
	//	2 meters - 50 meters. However, equation should work outside that range, that
	//	is just what I expect. See http://bit.ly/1ykAjbd for a graph of the relation.
	///
	private FSPL(dbm: number): number {

		return Math.pow(10.0, ((27.55 - (20.0 * Math.log(2412.0) / Math.log(10.0)) + Math.abs(dbm)) / 20.0));
	}

	private GetStationLocation(stationName):common.Point {
		var result = null;
		var station:Station = this.m_stations[stationName];
		if (station != null) {
			result = new common.Point(station.point.x(), station.point.y());
		}

		return result;
	}

	private VoteForPoint(points:common.Point[], entries: common.BluetoothEntry[], pair:EntryPair):common.Point {
		var self = this;
		var pointsCounter:number[] = [];
		points.forEach(function (val, idx, arr) {
			pointsCounter.push(0);
		});

		var stationCircles:common.Circle[] = [];
		entries.forEach(function(entry, idx, arr) {
			if (entry != pair.first && entry != pair.second) {
				var radius = self.FSPL(entry.strength);
				var pos =self.GetStationLocation(entry.stationId);
				stationCircles.push(new common.Circle(radius, pos));
			}
		});

		stationCircles.forEach(function (circle, idx, arr) {
			var idxToVoteFor = 0;
			var minDist = Number.MAX_VALUE;

			points.forEach(function (point, index, pointArr) {
				var expectedDist = circle.radius();
				var actualDist = circle.center().SubtractVector(point).Magnitude();
				var delta = Math.abs(expectedDist - actualDist);
				if (delta < minDist) {
					idxToVoteFor = index;
					minDist = delta;
				}
			});

			++pointsCounter[idxToVoteFor];
		});

		var selectedPointIndex = 0;
		var maxCount = 0;
		pointsCounter.forEach(function (count, idx, arr) {
			if (count > maxCount) {
				maxCount = count;
				selectedPointIndex = idx;
			}
		});

		return points[selectedPointIndex];
	}

	private DeterminePoint(pair: EntryPair, entries:common.BluetoothEntry[]):common.Point {
		var result: common.Point = null;
		var firstDist = this.FSPL(pair.first.strength);
		var secondDist = this.FSPL(pair.second.strength);

		var firstStationLocation = this.GetStationLocation(pair.first.stationId);
		var secondStationLocation = this.GetStationLocation(pair.second.stationId);
		
		if (firstStationLocation != null && secondStationLocation != null) {
			var vecBetweenStations = firstStationLocation.SubtractVector(secondStationLocation);
			var distBetweenStations = vecBetweenStations.Magnitude();

			// we have 1 of 2 cases. Either the Point is so far from each station that there is no intersection of the Circles
			// and we need to choose a Point in the direct line between the stations as a likely Point. Case 2 is the Circles
			// are close enough to overlap and so there are 2 possible Points, we will need to select one of the two Points.
			if (distBetweenStations > (firstDist + secondDist)) {
				// too far apart for there to be overlap
				var ratioFromFirst = (firstDist) / (firstDist + secondDist);
				result = vecBetweenStations.MultVector(ratioFromFirst);
			}
			else {
				var c1 = new common.Circle(firstDist, firstStationLocation);
				var c2 = new common.Circle(secondDist, secondStationLocation);

				var intersections = c1.FindIntersections(c2);
				if (intersections != null) {
					// need to select 1 of the  points... lets vote!
					result = this.VoteForPoint(intersections, entries, pair);
				}
			}
		}
		else {
			console.log('Unable to retrieve position for either : ' + pair.first.stationId + ' or ' + pair.second.stationId);
		}

		return result;
	}

	private GenerateStationPairs(entries: common.BluetoothEntry[]): EntryPair[] {
		var res:EntryPair[] = [];

		entries.forEach(function (val, index, array) {
			array.slice(index + 1, array.length).forEach(function (second, index, array) {
				res.push({ first: val, second: second });
			});
		});

		return res;
	}
}