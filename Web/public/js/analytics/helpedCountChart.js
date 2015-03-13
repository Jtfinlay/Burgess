function HelpedCountChart() {}

HelpedCountChart.prototype = {
	constructor: HelpedCountChart,
	drawChart: function(idSVG, data) {
		this.id = idSVG;
		var self = this;
		
		nv.addGraph(function() {
			self.chart = nv.models.multiBarHorizontalChart()
				.x(function(d) { return d.label })
				.y(function(d) { return d.value })
				.margin({top:30, right:20, bottom:50, left:175})
				.showYAxis(false)
				.showLegend(false)
				.showControls(false)
				.showValues(true)
				.tooltips(true);

			d3.select(idSVG)
				.datum(data)
				.transition().duration(1000)
				.call(self.chart);
			
			nv.utils.windowResize(self.chart.update);
			return self.chart;
		});
	},
	
	updateChart: function(data) {
		d3.select(this.id)
			.datum(data)
			.call(this.chart);
	}
};
