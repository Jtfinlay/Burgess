function TimeLapse(idCanvas, width, height, data) {
	this.id = idCanvas;
	this.width = width;
	this.height = height;
	this.vis = d3.select(idCanvas);
}

TimeLapse.prototype = {
	constructor: TimeLapse,
	// TODO Documentation
	setData: function(data) {
		var that = this;

		nv.addGraph(function() {
  			var chart = nv.models.lineChart()
                		.margin({left: 100})
                		.useInteractiveGuideline(true)
                		.transitionDuration(350)
                		.showLegend(true)
                		.showYAxis(true)
                		.showXAxis(true);
			chart.xAxis
				.axisLabel('Time (ms)')
      				.tickFormat(d3.format(',r'));
			chart.yAxis
      				.axisLabel('Voltage (v)')
      				.tickFormat(d3.format('.02f'));
			data = that.sinAndCos();
			
			that.vis
				.datum(data)
				.call(chart);

			nv.utils.windowResize(function() { chart.update() });
			return chart;
		});
	},
	/**************************************
 * Simple test data generator
 */
sinAndCos: function() {
  var sin = [],sin2 = [],
      cos = [];

  //Data is represented as an array of {x,y} pairs.
  for (var i = 0; i < 100; i++) {
    sin.push({x: i, y: Math.sin(i/10)});
    sin2.push({x: i, y: Math.sin(i/10) *0.25 + 0.5});
    cos.push({x: i, y: .5 * Math.cos(i/10)});
  }

  //Line chart data should be sent as an array of series objects.
  return [
    {
      values: sin,      //values - represents the array of {x,y} data points
      key: 'Sine Wave', //key  - the name of the series.
      color: '#ff7f0e'  //color - optional: choose your own line color.
    },
    {
      values: cos,
      key: 'Cosine Wave',
      color: '#2ca02c'
    },
    {
      values: sin2,
      key: 'Another sine wave',
      color: '#7777ff',
      area: true      //area - set to true if you want this line to turn into a filled area chart.
    }
  ];
}
}
