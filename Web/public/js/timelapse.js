function TimeLapse() {}

TimeLapse.prototype = {
	constructor: TimeLapse,
	// TODO Documentation
	drawChart: function(idSVG, data) {
		var that = this;
		var vis = d3.select(idSVG);

		nv.addGraph(function() {
  			var chart = nv.models.lineChart()
                		.transitionDuration(350)
				.interactive(false)
				.showLegend(false)
                		.showXAxis(true)
                		.showYAxis(true);
			chart.xAxis
				.axisLabel('Time')
				.tickFormat(function(d) { return d3.time.format('%H:%M')(new Date(d));})
			chart.yAxis
      				.axisLabel('Customers')
      				.tickFormat(d3.format('1.0f'));
			
			vis
				.datum(data)
				.call(chart);

			nv.utils.windowResize(function() { chart.update() });
			return chart;
		});
	},
	drawSelector: function(idSVG) {
		
		var vis = d3.select(idSVG);

		var width = $(idSVG).width();
		var height = $(idSVG).height();

		var container = vis
			.append('svg')
			.attr('x', 60)
			.attr('y', 20)
			.attr('width', width-80)
			.attr('height', height-57);
		var drag = d3.behavior.drag()
			.on('dragstart', function() { rectangle.style('opacity', 1)})
			.on('drag', function () {
				rectangle.attr('x', Math.max(0, Math.min(d3.event.x - container.attr('x'), container.attr('width')-4)));
			})
			.on('dragend', function() { rectangle.style('opacity', .4)});

		var rectangle = container.append('rect')
					 .attr('id', 'selector')
					 .attr('width', 4)
					 .attr('height', height-71)
					 .attr('fill', 'blue')
					 .attr('cursor', 'pointer')
					 .style('opacity', .4)
					 .call(drag);

	}
}
