﻿var assert = require('assert');
var common = require('../../Common');
var solver = require('../WifiPositionSolver');

// Allow up to a one and a half meter of variance, If I could get results this good in reality I would be very happy
var EPSILON = 1.5;

function IsNear(pos, x, y) {
    var p1 = new common.Point(x, y);
    var p2 = new common.Point(pos.x, pos.y);
    var d = p1.Distance(p2);
    return d <= EPSILON;
}

// Test a point that is in the middle of the stations
function Test1() {
    console.log("Test 1...");

    var s = new solver.PositionSolver(null, null);
    var t = new Date().toString();
    var entry1 = new common.WifiEntry("test", -57, t, "rasp-1");
    var entry2 = new common.WifiEntry("test", -58, t, "rasp-2");
    var entry3 = new common.WifiEntry("test", -57, t, "rasp-3");
    var posResult = s.CalculatePosition("test", [entry1, entry2, entry3]);

    // point should be near (5, 5).
    assert.ok(IsNear(posResult, 5, 5), "T1 Failed");
}
exports.Test1 = Test1;

function Test2() {
    console.log("Test 2...");

    var s = new solver.PositionSolver(null, null);
    var t = new Date().toString();
    var entry1 = new common.WifiEntry("test", -63, t, "rasp-1");
    var entry2 = new common.WifiEntry("test", -60, t, "rasp-2");
    var entry3 = new common.WifiEntry("test", -60, t, "rasp-3");
    var posResult = s.CalculatePosition("test", [entry1, entry2, entry3]);

    // point should be near (10, 10).
    assert.ok(IsNear(posResult, 10, 10), "T2 Failed");
}
exports.Test2 = Test2;

function Test3() {
    console.log("Test 3...");

    var s = new solver.PositionSolver(null, null);
    var t = new Date().toString();
    var entry1 = new common.WifiEntry("test", -57, t, "rasp-1");
    var entry2 = new common.WifiEntry("test", -50, t, "rasp-2");
    var entry3 = new common.WifiEntry("test", -61, t, "rasp-3");
    var posResult = s.CalculatePosition("test", [entry1, entry2, entry3]);

    // point should be near (7, 1).
    assert.ok(IsNear(posResult, 7, 1), "T3 Failed");
}
exports.Test3 = Test3;

console.log("Running tests");

exports.Test1();
exports.Test2();
exports.Test3();

console.log("All tests passed");
//# sourceMappingURL=WifiSolverTester.js.map
