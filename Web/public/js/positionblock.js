function PositionBlock() {
	this.data = {};
	this.tf = 0;
	this.ti = 0;
}

PositionBlock.prototype = {
	constructor: PositionBlock,

	/** Request data from given date **/
	requestData_Date: function(date, callback) {
		var that = this;
		this.parseTimes(date);

		$.post("timelapse/date",
			{"value": date},
			function(result) { that.loadData(result); callback(); }
		)
	},
	/** Request live data **/
	requestData_Live: function(callback) {
		var self = this;
		$.get("livefeed/data",
			function(result) { self.loadData(result); callback(); }
		)
	},
	/** Format data from post return **/
	loadData: function(result) {
        var self = this;
        this.data = {};

        $.each(JSON.parse(result), function(index, v) {
            self.data[v.t] = [];
            $.each(v.data, function(index, e) {
                self.data[v.t].push(new Position(e.mac, e.x, e.y, e.radius, e.priority));
            });
        });
	},
	/** Get number of unique customers per hour **/
	getCustomersHourly: function() {
		result = [];
		var i;
		for (i=this.ti; i<this.tf; i+= 3600*1000) {
			result.push({
				"x": i,
				"y": this.getUniqueDevices(this.getWithinInterval(i,i+3600*1000)).length
			});
		}
		return result;
	},
	/** Binary search for position **/
	getUserPositions: function(t) {
		var values = Object.keys(this.data);
		var error = 20000;

		var minIndex = 0;
		var maxIndex = values.length - 1;
		var currentIndex;
		var currentElement;

		while (minIndex <= maxIndex) {
			currentIndex = (minIndex + maxIndex) / 2 | 0;
        	currentElement = values[currentIndex];

        	if (currentElement < t-error) {
            	minIndex = currentIndex + 1;
        	}
        	else if (currentElement > t+error) {
            	maxIndex = currentIndex - 1;
        	}
        	else {
            	return this.data[values[currentIndex]];
        	}
		}

		return [];
	},
	getWithinInterval: function(ti, tf) {
		return $.grep(Object.keys(this.data), function(d,i) {
			return d > ti && d < tf;
		});
	},
	getUniqueDevices: function(keys) {
		var self = this;
		var result = {};
		$.each(keys, function(i, key) {
			$.each(self.data[key], function(i, e) {
				result[e.id] = true;
			});
		});
		return Object.keys(result);
	},
	parseTimes: function(date) {
		var split = date.split('-');
		this.ti = Date.UTC(parseInt(split[2]),parseInt(split[0])-1,parseInt(split[1]));
		this.ti += parseInt(split[3])*60000;
		this.tf = this.ti + 24*3600*1000;
	}
}

function Position(id, x, y, radius, priority) {
	this.id = id;
	this.x = x;
	this.y = y;
	this.radius = radius;
	this.priority = priority;
}
Position.prototype = {
	constructor: PositionBlock
}
