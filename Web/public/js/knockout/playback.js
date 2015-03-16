var formatDate = function(d) {
	return String.leftPad(d.getMonth() + 1, 2, '0') + '-' + String.leftPad(d.getDate(), 2, '0') + '-' + d.getFullYear();
}

/** TIME SELECT **/
var timeSelect = new TimeSelect();
timeSelect.drawChart("#chart", [{key: "Customers", values: []}]);
timeSelect.drawSelector("#time");
timeSelect.selectorMoved = function(x) { vm.timePercent(x); }


function PlaybackViewModel() {
	var self = this;

	self.drawables = ko.observableArray();
	self.positions = {};

	self.timePercent = ko.observable(0);
	self.timeString = ko.computed(function() {
		return new Date(timeSelect.xi + self.timePercent() * (timeSelect.xf - timeSelect.xi));
	});
	self.playing = ko.observable(false);
	self.dateSelected = ko.observable(formatDate(new Date()));

	self.play = function() {
		timeSelect.play(0.1);
		self.playing(true);
	};
	self.stop = function() {
		timeSelect.stop();
		self.playing(false);
	};
	self.pullData = function() {
		date = self.dateSelected();
		var time = new Date(date).getTime();
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
				$.each(JSON.parse(result), function(key, value) {
					data.push({"x":key, "y": value});
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
	$.each(getUserPositions(t), function(i,d) {
		vm.drawables().push(new Drawable(d));
	})
	map.draw(vm.drawables());
})
vm.pullData();