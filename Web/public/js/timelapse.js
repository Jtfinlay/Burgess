function TimeLapse() {}

TimeLapse.prototype = {
	constructor: TimeLapse,
	/*
	 * Draw chart on <svg> from customer data.
	 *
	 * idSVG: <id> of <svg> object
	 * data: Customer data in the format:
	 * {x: Time [Date], y: Customers Count [Int]}
	 */
	drawChart: function(idSVG, data) {
		var that = this;
		var vis = d3.select(idSVG);
		

		nv.addGraph(function() {
  			var chart = nv.models.lineChart()
				.width($(idSVG).attr('width'))
				.height($(idSVG).attr('height'))
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
					
			chart.forceY(0);
			
			vis
				.datum(data)
				.call(chart);

			nv.utils.windowResize(function() { chart.update() });
			return chart;
		});
	},
	/*
	 * Draw selector on <svg> as chart overlay.
	 *
	 * idSVG: <id> of <svg> object
	 */
	drawSelector: function(idSVG) {
		
		var that = this;
		var vis = d3.select(idSVG);

		var BAR_SIZE = 4;
		var MARGINS = { left: 60, top: 20, right: 80, bottom: 70 };
		var WIDTH = $(idSVG).attr('width');
		var HEIGHT = $(idSVG).attr('height');

		var container = vis
			.append('svg')
			.attr('x', MARGINS.left)
			.attr('y', MARGINS.top)
			.attr('width', WIDTH-MARGINS.right)
			.attr('height', HEIGHT-MARGINS.bottom);
			
		var drag = d3.behavior.drag()
			.on('dragstart', function() { rectangle.style('opacity', 1)})
			.on('drag', function () {
				rectangle.attr('x', Math.max(0, Math.min(d3.event.x - container.attr('x'), container.attr('width')-BAR_SIZE)));
				that.selectorMoved(
					rectangle.attr('x') / container.attr('width')
				);
			})
			.on('dragend', function() { rectangle.style('opacity', .4)});

		var rectangle = container.append('rect')
					 .attr('id', 'selector')
					 .attr('width', BAR_SIZE) //71
					 .attr('height', HEIGHT-MARGINS.top)
					 .attr('fill', 'blue')
					 .attr('cursor', 'pointer')
					 .style('opacity', .4)
					 .call(drag);

	},
	/*
	 * Hook for when selector is moved.
	 *
	 * x: Location on x-axis within [0, 1]
	 */
	selectorMoved: function(x) {}
}
