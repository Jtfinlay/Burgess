function PeakChart() {
    this.employees = this.formatEmployeeData([]);
    this.customers = this.formatCustomerData([]);
}

PeakChart.prototype = {
	constructor: PeakChart,

    formatCustomerData: function(customers) {
    	return [{
    		"key": "Customers",
    		"color": "#d62728",
    		"values": customers
    	}]
    },
    formatEmployeeData: function(employees) {
        return [{
            "key": "Employees",
            "color": "#1f77b4",
            "values": employees
        }]
    },
    drawChart: function(idSVG, customers, employees) {
        this.id = idSVG;
        var self = this;
        if (self.chart != null) { return self.updateChart(customers, employees); }

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

            self.updateChart(customers, employees);

            nv.utils.windowResize(self.chart.update);
            return self.chart;
        });
    },

    updateChart: function(customers, employees) {
        if (customers) this.customers = customers;
        if (employees) this.employees = employees;

        d3.select(this.id)
            .datum(this.customers.concat(this.employees))
            .transition().duration(1000)
            .call(this.chart);
    }
};


