/// <reference path='../Scripts/typings/mongodb/mongodb.d.ts' />
/// <reference path='../Scripts/typings/express/express.d.ts' />
var constants = require('../Constants');
var common = require('../Common');

var Receiver = (function () {
    function Receiver(solver, db, app) {
        this.m_solver = solver;
        this.m_db = db;

        var self = this;
        app.post('/rawWifi', function (req, res) {
            var macsToUpdate = self.saveRawToDB(req.body.data, function (macsToUpdate) {
                console.log("Wifi Solving for : " + macsToUpdate.length);
                self.m_solver.solveFor(macsToUpdate);
            });
            res.sendStatus(200);
        });
    }
    Receiver.prototype.saveRawToDB = function (raw, cb) {
        var updatedMacs = [];
        var macSet = {};
        var self = this;

        this.m_db.collection(constants.RAW_WIFI_COLLECTION, function (err, rawWifiCollection) {
            if (err) {
                console.log('Error opening raw Wifi DB collection: ' + err);
                return;
            }

            var entries = [];

            raw.wifiData.forEach(function (rawEntry, index, array) {
                var entry = new common.WifiEntry(rawEntry.mac, rawEntry.strength, rawEntry.time, raw.id);
                entries.push(entry);
                macSet[entry.mac] = entry.mac;
            });

            rawWifiCollection.insert(entries, function (error, result) {
                if (error) {
                    console.log('Error saving entry to DB : ' + error);
                }
            });

            for (var id in macSet) {
                updatedMacs.push(id);
            }

            cb(updatedMacs);
        });
    };
    return Receiver;
})();
exports.Receiver = Receiver;
//# sourceMappingURL=WifiReceiver.js.map
