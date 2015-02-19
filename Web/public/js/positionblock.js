function PositionBlock() {
	this.data = [];
	this.tf = 0;
	this.ti = 0;
}

PositionBlock.prototype = {
	constructor: PositionBlock,
	
	requestData: function(date, callback) {
		var that = this;
		this.parseTimes(date);

		$.post("timelapse/date",
			{"value": date},
			function(result) { that.loadData(result); callback(); }
		)	
	},
	loadData: function(result) {
		var that = this;
		this.data = [];
		$.each(JSON.parse(result), function(index, v) {
			that.data.push(new Position(v.x, v.y, v.bluetooth, v.wifi, v.time*1000));
		});
		//this.tf = Math.max.apply(Math,this.data.map(function(d){return d.time}));
		//this.ti = Math.min.apply(Math,this.data.map(function(d){return d.time}));	
	},
	getCustomersHourly: function() {
		result = [];
		var i;
		for (i=this.ti; i<this.tf; i+= 3600*1000) {
			result.push({
				"x": i,
				"y": this.getUniques(this.getWithinInterval(i,i+3600*1000),"wifi").length
			});
		}
		return result;
	},
	
	getMostRecent: function(ti, tf) {
		return this.getUniques(this.getWithinInterval(ti,tf).sort(function(a,b)
		{
			if (a.time == b.time) return 0;
			if (a.time < b.time) return 1;
			return -1;
		}),"wifi");
	},
	
	getWithinInterval: function(ti, tf) {
		return $.grep(this.data, function(d,i) {
			return d.time > ti && d.time < tf;
		});
	},
	
	getUniques: function(array, field) {
		var results = [];
		var field_array = [];
		$.each(array, function(i, item) {
			if ($.inArray(item[field],field_array) == -1) {
				field_array.push(item[field]);
				results.push(item);
			}
		});
		return results;
	},
	parseTimes: function(date) {
		var split = date.split('-');
		this.ti = Date.UTC(parseInt(split[2]),parseInt(split[0])-1,parseInt(split[1]));
		this.ti += parseInt(split[3])*60000;
		this.tf = this.ti + 24*3600*1000;
	}
}


function Position(x, y, bluetooth, wifi, time) {
	this.x = x;
	this.y = y;
	this.bluetooth = bluetooth;
	this.wifi = wifi;
	this.time = time;
}
Position.prototype = {
	constructor: PositionBlock
}
