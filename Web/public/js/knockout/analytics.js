/* GRAPH */
var helpedCountChart = new HelpedCountChart();
var helpedTimeChart = new HelpedTimeChart();
var peakChart = new PeakChart();


function AnalyticsViewModel() {
	var self = this;

	self.employees = [];
	self.helpCount = [];
	self.helpTime = [];
	self.peakCustomerTimes = [];
	self.peakEmployeeTimes = [];
	
	/* 
	 *	Pull analytical data between given times
	 */
	self.pullData = function(ti, tf) {
		self.employees = [];
		self.helpCount = [];
		self.helpTime = [];
		self.peakTimes = [];
		self.REST = 0;
		self.PEAK = 0;
		self.REST_total = 3;

		$.post("/analytics/customersHourly",
			{"ti":ti, "tf":tf},
			function(data) {
				self.peakCustomerTimes = [];
				$.each(JSON.parse(data), function(index, value) {
				 	self.peakCustomerTimes.push([value.x, value.y])
				})
				peakChart.drawChart("#peakHours svg",
					peakChart.formatCustomerData(self.peakCustomerTimes), null);
			}
		);
		$.post("/analytics/employeesHourly",
			{"ti":ti, "tf":tf},
			function(data) {
				self.peakEmployeeTimes = [];
				$.each(JSON.parse(data), function(index, value) {
					self.peakEmployeeTimes.push([value.x, value.y])
				})
				peakChart.drawChart("#peakHours svg",
					null, peakChart.formatEmployeeData(self.peakEmployeeTimes));
			}
		);
		$.post("/analytics/helpCount",
    		{"ti":ti, "tf":tf},
    		function(data) {
				$.each(JSON.parse(data), function(key, value) {
					self.helpCount.push([key,value])
				})
				self.REST++;
				self.mapData();
    		}
		);
		$.post("/analytics/helpTime",
			{"ti":ti, "tf":tf},
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
		helpedCountChart.drawChart("#helpCount svg", 
			helpedCountChart.formatData(self.employees));
		helpedTimeChart.drawChart("#helpTime svg",
			helpedTimeChart.formatData(self.employees));
	};
}

var vm = new AnalyticsViewModel();
$(function() {
	ko.applyBindings(vm);
});

var formatDate = function(d) {
	return String.leftPad(d.getMonth() + 1, 2, '0') + '-' + String.leftPad(d.getDate(), 2, '0') + '-' + d.getFullYear();
}
var stringToDate = function(s) {
	var val = s.split("-");
	return new Date(val[2],val[0]-1,val[1]);
}
/* Date time picker */
$("#datetimepicker").datetimepicker({
	format:'m-d-Y',
	lang:'en',
	timepicker:false
});
// $("#datetimepicker").val(formatDate(new Date()));
$("#datetimepicker").val("03-31-2015");
$("#datetimeselected").click(function() {
	m = (stringToDate($("#datetimepicker").val())).getTime()
	vm.pullData(m, m+24*3600*1000);
});
/* Init */
$("#datetimeselected").click();