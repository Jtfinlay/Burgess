function TimeSelect() {
	this.xi = 0;
	this.xf = 0;
}

TimeSelect.prototype = {
	constructor: TimeSelect,
	/*
	 * Draw chart on <svg> from customer data.
	 *
	 * idSVG: <id> of <svg> object
	 * data: Customer data in the format:
	 * {x: Time [Date], y: Customers Count [Int]}
	 */
	drawChart: function(idSVG, data) {
		this.id = idSVG;
		var that = this;

		nv.addGraph(function() {
  			that.chart = nv.models.lineChart()
				.width($(idSVG).attr('width'))
				.height($(idSVG).attr('height'))
				.interactive(false)
				.showLegend(false)
				.showXAxis(true)
				.showYAxis(true);

			that.chart.xAxis
				.axisLabel('Time')
				.tickFormat(function(d) { return d3.time.format('%H:%M')(new Date(d));})
			
			that.chart.yAxis
      			.axisLabel('Customers')
      			.tickFormat(d3.format('1.0f'));
					
			that.chart.forceY(0);
			
			that.updateChart(data);
			nv.utils.windowResize(function() { that.chart.update() });
			return chart;
		});
	},
	/*
	 *
	 * Change data in chart
	 *
	 */
	updateChart: function(data) {
		d3.select(this.id)
		  .datum(data)
		  .call(this.chart);

		this.xi = Math.min.apply(Math, data[0].values.map(function (val) {return val.x; }));
		this.xf = Math.max.apply(Math, data[0].values.map(function (val) {return val.x; }));
		this.selector.attr('x', 0);
	},
	/*
	 * Draw selector on <svg> as chart overlay.
	 *
	 * idSVG: <id> of <svg> object
	 */
	drawSelector: function(idSVG) {
		
		var self = this;
		var vis = d3.select(idSVG);

		var BAR_SIZE = 4;
		var MARGINS = { left: 60, top: 20, right: 80, bottom: 70 };
		var WIDTH = $(idSVG).attr('width');
		var HEIGHT = $(idSVG).attr('height');

		this.container = vis
			.append('svg')
			.attr('x', MARGINS.left)
			.attr('y', MARGINS.top)
			.attr('width', WIDTH-MARGINS.right)
			.attr('height', HEIGHT-MARGINS.bottom);
			
		var drag = d3.behavior.drag()
			.on('dragstart', function() { self.selector.style('opacity', 1)})
			.on('drag', function () {
				self.selector.attr('x', Math.max(0, Math.min(d3.event.x, self.container.attr('width')-BAR_SIZE)));
				self.selectorMoved(
					self.selector.attr('x') / self.container.attr('width')
				);
			})
			.on('dragend', function() { self.selector.style('opacity', .4)});

		self.selector = self.container.append('rect')
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
	selectorMoved: function(x) {},
	
	/*
	 * Move the selector by a set amount.
	 */
	translateSelector: function(dx) {
		var x = parseFloat(this.selector.attr('x'))+dx;
		var prop = x / this.container.attr('width');
		if (prop >= 1) {
			this.stop();
			this.selectorMoved(1);
		} else {
			this.selector.attr('x', x);
			this.selectorMoved(prop);
		}
	},
	
	/*
	 * Start moving selector automatically.
	 */
	play: function(rate) {
		var self = this;
		self.timer = self.timer || setInterval(function() {
			self.translateSelector(rate);	
		}, 100);
	},
	stop: function() {
		clearInterval(this.timer);
		this.timer = null;
	}
}
