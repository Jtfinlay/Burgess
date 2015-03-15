/**
 *	Employee {
 *		_id: {"$oid": ... },
 *		retailer: {"$oid": ... },
 *		name: String,
 *		mac: String,
 *		auth_code: String
 *	}
 */
function Employee(data) {
	var self = this;
	data = data || {};

	self._id = data._id;
	self.retailer = data.retailer;
	self.name = ko.observable(data.name);
	self.auth_code = ko.observable(data.auth_code || generateID());
	self.mac = ko.observable(data.mac);

	self.renew_token = function() {
		self.auth_code(generateID());
	};
}

/**
 *	Drawable {
 *		id: string
 *		x: float
 *		y: float
 *		radius: float
 *		priority: float
 *		employee: bool
 *	}
 */
function Drawable(data) {
	var self = this;
	data = data || {};

	self.id = ko.observable(data.mac);
	self.x 	= data.x;
	self.xf = data.x;
	self.y	= data.y;
	self.yf = data.y;
	self.radius = data.radius;
	self.priority = data.priority;
	self.employee = data.employee;

	self.name = ko.observable("Unknown");
	self.lastUpdated = 0;
	self.color = ko.observable('rgba(0,0,0,0.5)');

	self.update = function(drawable) {
		self.x = drawable.x;
		self.y = drawable.y;
		self.radius = drawable.radius;
		self.priority = drawable.priority;
		self.lastUpdated = drawable.lastUpdated;
	}

	self.draw = function(widthm, widthpx, heightm, heightpx) {
		var x = (self.x / widthm) * widthpx;
		var y = (self.y / heightm) * heightpx;
		var r = (self.radius / widthm) * widthpx;

		if (self.employee) {
			jc.circle(x, y, r, 'rgba(0,0,150,0.25)', true);
			jc.rect(x-6, y-6, 12, 12, self.color, 1);
		} else {
			jc.circle(x, y, r, 'rgba('+(255*self.priority)+','+(255*(1-self.priority))+',0,0.25)', true);
			jc.circle(x, y, 6, 'rgba('+(255*self.priority)+',0,'+(255*(1-self.priority))+',0.5)', true);
		}
	}
}

/*
 *	In no way is this guaranteed unique.
 */
var generateID = function() {
    var d = new Date().getTime();
    var uuid = 'xyx-xxx-3xxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

