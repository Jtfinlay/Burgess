export class PositionEntry {

	// Note uses x,y instead of point to maintain compatibility with James' test data
	// TODO::JT see if we need to change his schema to match the point interface I have
	// been using throughout the position solver.
	constructor(
		public wifi: string,
		public x: number,
		public y: number,
		public uncertainty: number,
		public time: string,
		public bluetooth: string) {

	}


}

export class WifiEntry {
	constructor(
		public mac: string,
		public strength: number,
		public time: string,
		public stationId: string) {

	}
}

export class Point {
	private m_x: number;
	private m_y: number;

	constructor(x, y) {
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
		return new Point(p.x() - this.x(), p.y() - this.y());
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

export class Circle {
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
		if (d < Math.abs(this.radius() - c.radius())) {
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