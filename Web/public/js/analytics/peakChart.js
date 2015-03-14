function PeakChart() {}

PeakChart.prototype = {
	constructor: PeakChart,

    formatData: function(customers) {
    	return [{
    		"key": "Customers",
    		"color": "#d62728",
    		"values": customers
    	}]
    },

    drawChart: function(idSVG, data) {
        this.id = idSVG;
        var self = this;

        nv.addGraph(function() {
			self.chart = nv.models.stackedAreaChart()
				.margin({right: 100})
				.x(function(d) { return d[0] })
				.y(function(d) { return d[1] })
				.useInteractiveGuideline(true)
				.rightAlignYAxis(true)
				.transitionDuration(1000)
				.showControls(false)
				.clipEdge(true);

			self.chart.xAxis
				.showMaxMin(false)
				.tickFormat(function(d) {return d3.time.format('%H:%M')(new Date(parseInt(d)))});
			self.chart.yAxis
				.tickFormat(d3.format(',1'));
			d3.select(idSVG)
				.datum(data)
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


