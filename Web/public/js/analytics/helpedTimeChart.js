function HelpedTimeChart() {}

HelpedTimeChart.prototype = {
	constructor: HelpedTimeChart,

	formatData: function(employees) {
		var time = [];
        $.each(employees, function(i,v) {
            time.push({
                "label": v.name(),
                "value": v.helpTimes.reduce(
                    function(a,b){return a+b},0)/v.helpTimes.length
            })
        });
		return [{
            "key": "Today",
            "color": "#4f99b4",
            "values": time
        }];
	},

	drawChart: function(idSVG, data) {
        this.id = idSVG;
        var self = this;

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



