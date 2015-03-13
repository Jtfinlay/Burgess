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
					self.REST++;
					self.mapData();
				})
    		}
		);
		$.post("/analytics/helpTime",
			{"ti":1426118400000, "tf":1426204800000},
			function(data) {
				$.each(JSON.parse(data), function(key, value) {
					self.helpTime.push([key,value])
					self.REST++;
					self.mapData();
				})
			}
		);
		$.get("/employees", function(data) {
				$.each(JSON.parse(data), function(i, employee) {
					self.employees.push(new Employee(employee));
					self.REST++;
					self.mapData();
				}
			)}
		);
	};

	/*
	 *	Map analytical data to employee
	 */
	self.mapData = function() {
		if (self.REST < self.REST_total) return;

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

/* GRAPH */
var data = [
  {
    "key": "Series2",
    "color": "#1f77b4",
    "values": [
      { 
        "label" : "Group A" ,
        "value" : 25.307646510375
      } , 
      { 
        "label" : "Group B" ,
        "value" : 16.756779544553
      } , 
      { 
        "label" : "Group C" ,
        "value" : 18.451534877007
      } , 
      { 
        "label" : "Group D" ,
        "value" : 8.6142352811805
      } , 
      {
        "label" : "Group E" ,
        "value" : 7.8082472075876
      } , 
      { 
        "label" : "Group F" ,
        "value" : 5.259101026956
      } , 
      { 
        "label" : "Group G" ,
        "value" : 0.30947953487127
      } , 
      { 
        "label" : "Group H" ,
        "value" : 0
      } , 
      { 
        "label" : "Group I" ,
        "value" : 0 
      }
    ]
  }
];

var helpedCountChart = new HelpedCountChart();
helpedCountChart.drawChart("#helpCount svg", data);
/*this.chart;
var that = this;
nv.addGraph(function() {
	that.chart = nv.models.multiBarHorizontalChart()
		.x(function(d) { return d.label })
		.y(function(d) { return d.value })
		.margin({top:30, right:20, bottom:50, left:175})
		.showYAxis(false)
		.showValues(true)
		.showLegend(false)
		.tooltips(true)
		.showControls(false);

	d3.select("#helpCount svg")
		.datum(data)
		.transition().duration(500)
		.call(that.chart);
	
	nv.utils.windowResize(that.chart.update);
	
	return that.chart;
});
*/
