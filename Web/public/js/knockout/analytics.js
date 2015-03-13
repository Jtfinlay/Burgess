/* GRAPH */
var helpedCountChart = new HelpedCountChart();


function AnalyticsViewModel() {
	var self = this;

	self.employees = [];
	self.helpCount = [];
	self.helpTime = [];
	
	/* 
	 *	Pull analytical data between given times
	 */
	self.pullData = function(ti, tf) {
		self.employees = [];
		self.helpCount = [];
		self.helpTime = [];
		self.REST = 0;
		self.REST_total = 3;

		$.post("/analytics/helpCount",
    		{"ti":1426118400000, "tf":1426204800000},
    		function(data) {
				$.each(JSON.parse(data), function(key, value) {
					self.helpCount.push([key,value])
				})
				self.REST++;
				self.mapData();
    		}
		);
		$.post("/analytics/helpTime",
			{"ti":1426118400000, "tf":1426204800000},
			function(data) {
				$.each(JSON.parse(data), function(key, value) {
					self.helpTime.push([key,value])
				})
				self.REST++;
				self.mapData();
			}
		);
		$.get("/employees", function(data) {
				$.each(JSON.parse(data), function(i, employee) {
					self.employees.push(new Employee(employee));
				})
				self.REST++;
				self.mapData();
			}
		);
	};

	/*
	 *	Map analytical data to employee
	 */
	self.mapData = function() {
		if (self.REST < self.REST_total) return;

		/** Map data **/
		$.each(self.helpTime, function(i, data) {
			$.map($.grep(self.employees, function(e) {
				return e._id.$oid == data[0];
			}), function( val, ind) {
				val.helpTimes = data[1];
			});
		});
		
		$.each(self.helpCount, function(i, data) {
			$.map($.grep(self.employees, function(e) {
				return e._id.$oid == data[0];
			}), function( val, ind) {
				val.helpCount = data[1];
			});
		});

		/** Update charts **/
		console.log(helpedCountChart.formatData(self.employees));
		helpedCountChart.drawChart("#helpCount svg", 
			helpedCountChart.formatData(self.employees));
	};
}
var vm = new AnalyticsViewModel();
$(function() {
	ko.applyBindings(vm);
});


/* Init Logic */
var ti = 1426118400000
var tf = 1426204800000
vm.pullData(ti,tf);
