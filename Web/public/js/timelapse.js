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

		// MARGINS, xRange, yRange, xAxis yAxis
                var MARGINS = {top: 20, right: 20, bottom: 20, left: 50 },
                    xRange = d3.scale.linear().range([MARGINS.left, this.width - MARGINS.right])
                        .domain([d3.min(data, function(d) {
                        return d.x;
                    }), d3.max(data, function(d) {
                        return d.x;
                    })]),
                    yRange = d3.scale.linear().range([this.height - MARGINS.top, MARGINS.bottom])
                        .domain([d3.min(data, function(d) {
                        return d.y;
                    }), d3.max(data, function(d) {
                        return d.y;
                    })]),
                    xAxis = d3.svg.axis()
                        .scale(xRange)
                        .tickSize(5)
                        .tickSubdivide(true),
                    yAxis = d3.svg.axis()
                        .scale(yRange)
                        .tickSize(5)
                        .orient('left')
                        .tickSubdivide(true);

        this.vis.append('svg:g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(0,' + (this.height - MARGINS.bottom) + ')')
                .call(xAxis);

        this.vis.append('svg:g')
                .attr('class', 'y axis')
                .attr('transform', 'translate(' + (MARGINS.left) + ',0)')
                .call(yAxis);

        var lineFunc = d3.svg.line()
                .x(function(d) {
                        return xRange(d.x);
                })
                .y(function(d) {
                        return yRange(d.y);
                })
                .interpolate('linear');

		this.vis.append('svg:path')
			.attr('d', lineFunc(data))
			.attr('stroke', 'blue')
			.attr('stroke-width', 2)
			.attr('fill', 'none');
	}
	
	

}
