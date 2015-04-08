/// <reference path='../Scripts/typings/mongodb/mongodb.d.ts' />
var constants = require('../Constants');
var common = require('../Common');

var Station = (function () {
    function Station(id, point) {
        this.id = id;
        this.point = point;
    }
    return Station;
})();

var PositionSolver = (function () {
    function PositionSolver(rawDB, posDB, btLocDB) {
        this.m_rawDB = rawDB;
        this.m_posDB = posDB;
        this.m_btLocDB = btLocDB;
        this.m_stations = [];

        var self = this;

        this.getBluetoothStations(function (station) {
            self.m_stations.push(station);
        });
    }
    PositionSolver.prototype.solveFor = function (entry) {
        var position;
        var point = this.getPoint(entry.stationId);

        // Just use the current time, not precise but good enough
        var date = new Date();

        position = new common.PositionEntry(entry.mac, point.x(), point.y(), constants.BT_ERROR, date);

        this.m_posDB.collection(constants.POS_COLLECTION, function (err, collection) {
            if (err) {
                console.log('BluetoothSolver::Error opening position collection: ' + err);
                return;
            }
            collection.insert(position, function (error, result) {
                if (error) {
                    console.log('Error saving positions to DB : ' + error);
                }
            });
        });
    };

    PositionSolver.prototype.getBluetoothStations = function (cb) {
        var self = this;

        this.m_btLocDB.collection(constants.BLUETOOTHLOCATIONS_COLLECTION, function (err, collection) {
            if (err) {
                console.log('BluetoothLocations::Error opening collection: ' + err);
                return;
            }
            collection.find().toArray(function (err, stations) {
                if (err) {
                    console.log('BluetoothLocations::Error iterating over find : ' + err);
                    return;
                }

                stations.forEach(function (element, index, array) {
                    var station = new Station(element.name, new common.Point(element.x, element.y));
                    cb(station);
                });
            });
        });
    };

    PositionSolver.prototype.getPoint = function (stationID) {
        var result;
        this.m_stations.forEach(function (station, index, array) {
            if (station.id == stationID)
                result = station.point;
        });
        return result;
    };
    return PositionSolver;
})();
exports.PositionSolver = PositionSolver;
//# sourceMappingURL=BluetoothPositionSolver.js.map
