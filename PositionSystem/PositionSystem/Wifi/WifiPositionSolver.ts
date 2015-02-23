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

interface WifiEntryPair {
	first: WifiEntry;
	second: WifiEntry;
}

class Point {
	private m_x: number;
	private m_y: number;

	constructor(x, y){
		this.m_x = x;
		this.m_y = y;
	}

	public x(): number { return this.m_x; }
	public y(): number { return this.m_y; }

	public Distance(p: Point): number {
		var xSquared = (this.x() - p.x()) * (this.x() - p.x());
		var ySquared = (this.y() - p.y()) * (this.y() - p.y());
		return Math.sqrt(xSquared + ySquared);
	}

	public AddVector(p: Point): Point {
		return new Point(p.x() + this.x(), p.y() + this.y());
	}

	public SubtractVector(p: Point): Point {
		return new Point( p.x() - this.x(), p.y() - this.y());
	}

	public Magnitude(): number {
		return this.Distance(new Point(0, 0));
	}

	public MultVector(magnitude: number): Point {
		return new Point(this.x() * magnitude, this.y() * magnitude);
	}

	public Normalize(): Point {
		var m = this.Magnitude();
		return new Point(this.x() / m, this.y() / m);
	}
}

class Circle {
	private m_center;
	private m_radius;

	constructor(radius: number, point: Point) {
		this.m_center = point;
		this.m_radius = radius;
	}

	public radius(): number { return this.m_radius; }
	public center(): Point { return this.m_center; }

	public FindIntersections(c: Circle): Point[] {
		// see http://paulbourke.net/geometry/circlesphere/ for math explanation
		// I use the same variables as there to make it easy to reference... sorry for the 1 letter variables
		// I wanted it to be consistent with the source as it does a much better job of explaining the math
		// than I would. P0 = this.center(), P1 = c.center()
		var d = this.center().Distance(c.center());

		if (d > this.radius() + c.radius()) {
			return []; // no points intersect
		}
		if(d < Math.abs(this.radius() - c.radius())) {
			return null; // all points intersect so no solution... these return values are rather arbitrary...
		}

		var a = (this.radius() * this.radius() - c.radius() * c.radius() + d * d) / (2.0 * d);
		var b = d - a;
		var h = Math.sqrt(this.radius() * this.radius() - a * a);
		
		// p2 = center + a * (p1-p0) / d
		var p1MinusP0 = this.center().SubtractVector(c.center());
		var p2 = this.center().AddVector(p1MinusP0.MultVector(a / d));

		// Note the plus minus!
		// x3 = x2 +- h * (y1 - y0) / d
		// y3 = y2 +- h * (x1 - x0) / d

		var x_term2 = h * (c.center().y() - this.center().y()) / d;
		var y_term2 = h * (c.center().x() - this.center().x()) / d;

		var p3 = new Point(p2.x() + x_term2, p2.y() + y_term2);
		var p4 = new Point(p2.x() - x_term2, p2.y() - y_term2);

		return [p3, p4];
	}
}

interface Station {
	id: string;
	point: Point;
}

export class PositionSolver {

	private m_db: mongodb.Db;

	private m_stations:any;

	constructor(db:mongodb.Db) {
		this.m_db = db;

		// TODO::JT store this in DB and retrieve. Just hacking together for the time being
		this.m_stations = {
			"vm-drone": {
				id: "vm-drone", point: new Point(0, 0)
			},
			"vm-drone2": {
				id: "vm-drone2", point: new Point(0, 15)
			},
			"vm-drone3": {
				id: "vm-drone3", point: new Point(25, 0)
			}
		}
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

	private StorePosition(mac: String, pos: Point, uncertainty: number): void{
		console.log("mac : " + mac + " pos : " + JSON.stringify(pos) + " u : " + uncertainty);
	}

	private CalculatePosition(mac: String, latestEntries: WifiEntry[]) {
		// can't perform trilateration without at least 3 measurements
		if (latestEntries.length >= 3) {
			var pairs = this.GenerateStationPairs(latestEntries);
			var points = this.DeterminePoints(pairs, latestEntries);
			var pos = this.AveragePoints(points);
			var uncertainty = this.CalcStdDeviation(pos, points);

			this.StorePosition(mac, pos, uncertainty);
		}
	}

	private AveragePoints(points: Point[]): Point {
		var x: number = 0;
		var y: number = 0;
		points.forEach(function (point, idx, arr) {
			x += point.x();
			y += point.y();
		});

		return new Point(x / points.length, y / points.length);
	}

	private CalcStdDeviation(meanPoint: Point, points: Point[]): number {
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

	private DeterminePoints(pairs:WifiEntryPair[], entries:WifiEntry[]): Point[] {
		var result: Point[] = [];
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

	private GetStationLocation(stationName): Point {
		var result = null;
		var station:Station = this.m_stations[stationName];
		if (station != null) {
			result = new Point(station.point.x(), station.point.y());
		}

		return result;
	}

	private VoteForPoint(points: Point[], entries: WifiEntry[], pair:WifiEntryPair): Point {
		var self = this;
		var pointsCounter:number[] = [];
		points.forEach(function (val, idx, arr) {
			pointsCounter.push(0);
		});

		var stationCircles: Circle[] = [];
		entries.forEach(function(entry, idx, arr) {
			if (entry != pair.first && entry != pair.second) {
				var radius = self.FSPL(entry.strength);
				var pos =self.GetStationLocation(entry.stationId);
				stationCircles.push(new Circle(radius, pos));
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

	private DeterminePoint(pair: WifiEntryPair, entries:WifiEntry[]): Point {
		var result:Point = null;
		var firstDist = this.FSPL(pair.first.strength);
		var secondDist = this.FSPL(pair.second.strength);

		var firstStationLocation = this.GetStationLocation(pair.first.stationId);
		var secondStationLocation = this.GetStationLocation(pair.second.stationId);
		
		if (firstStationLocation != null && secondStationLocation != null) {
			var vecBetweenStations = firstStationLocation.SubtractVector(secondStationLocation);
			var distBetweenStations = vecBetweenStations.Magnitude();

			// we have 1 of 2 cases. Either the point is so far from each station that there is no intersection of the circles
			// and we need to choose a point in the direct line between the stations as a likely point. Case 2 is the circles
			// are close enough to overlap and so there are 2 possible points, we will need to select one of the two points.
			if (distBetweenStations > (firstDist + secondDist)) {
				// too far apart for there to be overlap
				var ratioFromFirst = (firstDist) / (firstDist + secondDist);
				result = vecBetweenStations.MultVector(ratioFromFirst);
			}
			else {
				var c1 = new Circle(firstDist, firstStationLocation);
				var c2 = new Circle(secondDist, secondStationLocation);

				var intersections = c1.FindIntersections(c2);
				if (intersections != null) {
					// need to select 1 of the 2 points... lets vote!
					result = this.VoteForPoint(intersections, entries, pair);
				}
			}
		}
		else {
			console.log("Unable to retrieve position for either : " + pair.first.stationId + " or " + pair.second.stationId);
		}

		return result;
	}

	private GenerateStationPairs(entries: WifiEntry[]): WifiEntryPair[] {
		var res:WifiEntryPair[] = [];

		entries.forEach(function (val, index, array) {
			array.slice(index + 1, array.length).forEach(function (second, index, array) {
				res.push({ first: val, second: second });
			});
		});

		return res;
	}
}