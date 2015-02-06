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
		    width = this.width - MARGINS.left - MARGINS.right,
		    height = this.height - MARGINS.top - MARGINS.bottom;

		data.forEach(function(d) {
                    d.date = new Date(d.date);
                });

                var x = d3.time.scale()
			.range([0, width])
			.domain([d3.min(data, function(d){return d.date;}), 
				 d3.max(data, function(d){return d.date;})]),
                    y = d3.scale.linear()
			.range([height, 0])
			.domain([0, d3.max(data, function (d) { return d.customers; })]);
                    xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(5),
                    yAxis = d3.svg.axis().scale(y).orient("left").ticks(5);

                // Define line            
                var lineFunc = d3.svg.line()
                        .x(function(d) { return x(d.date); })
                        .y(function(d) { return y(d.customers); })
                        .interpolate('linear');

                // Add path
                this.vis.append("path")
                        .attr("class", "line")
                        .attr("d", lineFunc(data));
            
                // Add X Axis
                this.vis.append("g")
                        .attr("class", "x axis")
                        .attr("transform", "translate(0, " + height + ")")
                        .call(xAxis);

                // Add Y Axis
                this.vis.append("g")
                        .attr("class", "y axis")
                        .call(yAxis);
	}
}
