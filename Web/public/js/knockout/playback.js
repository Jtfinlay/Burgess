var dateToString = function(d) {
	return String.leftPad(d.getMonth() + 1, 2, '0') + '-' + String.leftPad(d.getDate(), 2, '0') + '-' + d.getFullYear();
}
var stringToDate = function(s) {
	var split = s.split('-');
	return new Date(split[2],parseInt(split[0])-1,split[1]);
}

/** TIME SELECT **/
var timeSelect = new TimeSelect();
timeSelect.drawChart("#chart", [{key: "Customers", values: []}]);
timeSelect.drawSelector("#time");
timeSelect.selectorMoved = function(x) { vm.timePercent(x); }

function PlaybackViewModel() {
	var self = this;

	self.employees = ko.observableArray();
	self.drawables = ko.observableArray();
	self.positions = {};

	self.timeScaleString = ko.observable(5);
	self.timeScale = ko.computed(function() {
		return self.timeScaleString() / 1000
	});
	self.timeScale.subscribe(function(newValue) {
		if (self.playing()) {
			self.stop();
			self.play();
		}
	});
	self.timePercent = ko.observable(0);
	self.timeString = ko.computed(function() {
		var d = new Date(timeSelect.xi + self.timePercent() * (timeSelect.xf - timeSelect.xi));
		return ("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2)+":"+("0"+d.getSeconds()).slice(-2);
	});
	self.setTimeScale = function(value) {
		console.log(value);
	}

	self.playing = ko.observable(false);
	self.dateSelected = ko.observable(dateToString(new Date()));

	self.play = function() {
		timeSelect.play(self.timeScale());
		self.playing(true);
	};
	self.stop = function() {
		timeSelect.stop();
		self.playing(false);
	};
	self.pullData = function() {
		var date = self.dateSelected();
		var time = stringToDate(date).getTime();
		$.post("/playback/date",
			{"t": time, "timezone":(new Date).getTimezoneOffset()},
			function (result) {
				self.positions = {};
				$.each(JSON.parse(result), function(index, v) {
					self.positions[v.t] = [];
					$.each(v.data, function(index, e) {
						self.positions[v.t].push(e);
					})
				});
			}
		);
		$.post("/analytics/customersHourly",
			{"ti":time, "tf":time+24*3600*1000},
			function(result) {
				var data = [];
				$.each(JSON.parse(result), function(i, value) {
					data.push(value);
				});
				timeSelect.updateChart([{key: "Customers", values: data}]);
			}
		);
	}

	
}
var vm = new PlaybackViewModel();
$(function() {
	ko.applyBindings(vm);
});

/** DATE TIME PICKER **/
$("#datetimepicker").datetimepicker({
	format: 'm-d-Y',
	lang:'en',
	timepicker:false
});

/** BINARY SEARCH **/
var getUserPositions = function(t) {
	var values = Object.keys(vm.positions);
	var error = 10000;

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
           	return vm.positions[values[currentIndex]];
       	}
	}
	return [];
}

/** RETAIL MAP **/
var map;
$.get("map/size", function(result) {
	var details = JSON.parse(result);
	map = new LiveMap("live_map", details.width, details.height, details.store_img);
});

vm.timePercent.subscribe(function(x) {
	var t = timeSelect.xi + x * (timeSelect.xf - timeSelect.xi);
	vm.drawables([]);
	vm.employees([]);
	$.each(getUserPositions(t), function(i,d) {
		vm.drawables().push(new Drawable(d));
		if (d.employee) { vm.employees().push(new Drawable(d))}
	})
	map.draw(vm.drawables());
})
vm.pullData();