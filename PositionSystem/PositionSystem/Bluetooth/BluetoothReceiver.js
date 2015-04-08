/// <reference path='../Scripts/typings/mongodb/mongodb.d.ts' />
/// <reference path='../Scripts/typings/express/express.d.ts' />
var constants = require('../Constants');
var common = require('../Common');

var StationName = (function () {
    function StationName(id, mac) {
        this.id = id;
        this.mac = mac;
    }
    return StationName;
})();

var Receiver = (function () {
    function Receiver(solver, db, app) {
        this.m_solver = solver;
        this.m_db = db;

        var self = this;
        app.post('/rawBluetooth', function (req, res) {
            self.saveRawToDB(req.body, function (entry) {
                console.log("Bluetooth Solver Solving");
                self.m_solver.solveFor(entry);
            });
            res.sendStatus(200);
        });

        app.get('/bluetoothStations', function (req, res) {
            var stations;
            self.getBluetoothStations(function (station) {
                stations.push(station);
            });
            res.send(JSON.stringify(stations));
        });
    }
    Receiver.prototype.saveRawToDB = function (raw, cb) {
        var entry;
        var self = this;

        self.m_db.collection(constants.RAW_BLUETOOTH_COLLECTION, function (err, rawBluetoothCollection) {
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
    };

    Receiver.prototype.getBluetoothStations = function (cb) {
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
                    var station = new StationName(element.name, element.mac);
                    cb(station);
                });
            });
        });
    };
    return Receiver;
})();
exports.Receiver = Receiver;
//# sourceMappingURL=BluetoothReceiver.js.map
