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
      				.tickFormat(d3.format(',r'));
			chart.yAxis
      				.axisLabel('Customers')
      				.tickFormat(d3.format('.02f'));
			data = that.sinAndCos();
			
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

	},
	/**************************************
 * Simple test data generator
 */
sinAndCos: function() {
  var sin = [],sin2 = [],
      cos = [];

  //Data is represented as an array of {x,y} pairs.
  for (var i = 0; i < 100; i++) {
    sin.push({x: i, y: 1+Math.sin(i/10)});
  }

  //Line chart data should be sent as an array of series objects.
  return [
    {
      values: sin,      //values - represents the array of {x,y} data points
      key: 'Sine Wave', //key  - the name of the series.
      color: '#ff7f0e'  //color - optional: choose your own line color.
    }
  ];
}
}
