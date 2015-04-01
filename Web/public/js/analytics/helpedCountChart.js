function HelpedCountChart() {}

HelpedCountChart.prototype = {
	constructor: HelpedCountChart,
	
	formatData: function(employees) {
		var count = [];
		$.each(employees, function(i,v) {
			count.push({
				"label": v.name(),
				"value": v.helpCount
			})
		});
		return [{
			"key": "Single day",
			"color": "#1f77b4",
			"values": count
		}];
	},
	
	drawChart: function(idSVG, data) {
		this.id = idSVG;
		var self = this;
		if (self.chart != null) { return self.updateChart(data); }
		
		nv.addGraph(function() {
			self.chart = nv.models.multiBarHorizontalChart()
				.x(function(d) { return d.label })
				.y(function(d) { return d.value })
				.margin({top:30, right:20, bottom:50, left:100})
				.showYAxis(false)
				.showLegend(true)
				.showControls(false)
				.showValues(true)
				.tooltips(false);

			self.updateChart(data);
			
			nv.utils.windowResize(self.chart.update);
			return self.chart;
		});
	},
	
	updateChart: function(data) {
		d3.select(this.id)
			.datum(data)
			.transition().duration(1000)
			.call(this.chart);
	}
};
