var PositionEntry = (function () {
    // Note uses x,y instead of point to maintain compatibility with James' test data
    // TODO::JT see if we need to change his schema to match the point interface I have
    // been using throughout the position solver.
    function PositionEntry(wifi, x, y, radius, time) {
        this.wifi = wifi;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.time = time;
    }
    return PositionEntry;
})();
exports.PositionEntry = PositionEntry;

var WifiEntry = (function () {
    function WifiEntry(mac, strength, time, stationId) {
        this.mac = mac;
        this.strength = strength;
        this.time = time;
        this.stationId = stationId;
    }
    return WifiEntry;
})();
exports.WifiEntry = WifiEntry;

var BluetoothEntry = (function () {
    function BluetoothEntry(mac, stationId, strength, time) {
        this.mac = mac;
        this.stationId = stationId;
        this.strength = strength;
        this.time = time;
    }
    return BluetoothEntry;
})();
exports.BluetoothEntry = BluetoothEntry;

var Point = (function () {
    function Point(x, y) {
        this.m_x = x;
        this.m_y = y;
    }
    Point.prototype.x = function () {
        return this.m_x;
    };
    Point.prototype.y = function () {
        return this.m_y;
    };

    Point.prototype.Distance = function (p) {
        var xSquared = (this.x() - p.x()) * (this.x() - p.x());
        var ySquared = (this.y() - p.y()) * (this.y() - p.y());
        return Math.sqrt(xSquared + ySquared);
    };

    Point.prototype.AddVector = function (p) {
        return new Point(p.x() + this.x(), p.y() + this.y());
    };

    Point.prototype.SubtractVector = function (p) {
        return new Point(p.x() - this.x(), p.y() - this.y());
    };

    Point.prototype.Magnitude = function () {
        return this.Distance(new Point(0, 0));
    };

    Point.prototype.MultVector = function (magnitude) {
        return new Point(this.x() * magnitude, this.y() * magnitude);
    };

    Point.prototype.Normalize = function () {
        var m = this.Magnitude();
        return new Point(this.x() / m, this.y() / m);
    };
    return Point;
})();
exports.Point = Point;

var Circle = (function () {
    function Circle(radius, point) {
        this.m_center = point;
        this.m_radius = radius;
    }
    Circle.prototype.radius = function () {
        return this.m_radius;
    };
    Circle.prototype.center = function () {
        return this.m_center;
    };

    Circle.prototype.FindIntersections = function (c) {
        // see http://paulbourke.net/geometry/circlesphere/ for math explanation
        // I use the same variables as there to make it easy to reference... sorry for the 1 letter variables
        // I wanted it to be consistent with the source as it does a much better job of explaining the math
        // than I would. P0 = this.center(), P1 = c.center()
        var d = this.center().Distance(c.center());

        if (d > this.radius() + c.radius()) {
            return [];
        }
        if (d < Math.abs(this.radius() - c.radius())) {
            return null;
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
        var y_term2 = Math.abs(h * (c.center().x() - this.center().x()) / d);

        var p3 = new Point(p2.x() + x_term2, p2.y() + y_term2);
        var p4 = new Point(p2.x() - x_term2, p2.y() - y_term2);

        return [p3, p4];
    };
    return Circle;
})();
exports.Circle = Circle;
//# sourceMappingURL=Common.js.map
