/** DATE TIME PICKER **/
$("#datetimepicker").datetimepicker({
	format: 'm-d-Y',
	lang:'en',
	timepicker:false,
	defaultDate: '2012/04/23'
});

/** RETAIL MAP **/
var map;
$.get("map/size", function(result) {
	var details = JSON.parse(result);
	map = new LiveMap("live_map", details.width, details.height, details.store_img);
});

/** LOGIC **/
function onDateSelected() {
    dataBlock.requestData_Date(($("#datetimepicker").val()+"-"+(new Date).getTimezoneOffset()),
    function() {
        timeSelect.updateChart([{key: "Customers", values: dataBlock.getCustomersHourly()}]);
    });
}
var selectTimer;
function onPlaySelected() {
	timeSelect.play(1);
}
function formatDate(d) {
    return (d.getMonth()+1)+"-"+d.getDate()+"-"+d.getFullYear();
}

var timeSelect = new TimeSelect();
var dataBlock = new PositionBlock();
$("#datetimepicker").val(formatDate(new Date));
dataBlock.requestData_Date(formatDate(new Date)+"-"+(new Date).getTimezoneOffset(), function (result) {
	timeSelect.drawChart("#chart", [{values: dataBlock.getCustomersHourly(), key: "Customers"}]);
	timeSelect.drawSelector("#time");
	timeSelect.selectorMoved = function(x) {
		var t = timeSelect.xi + x * (timeSelect.xf - timeSelect.xi);
		var positions = dataBlock.getUserPositions(t);
		$.each(positions, function(i,d) {
			map.addCustomer(d.x, d.y, d.radius, d.priority);
		});
		map.draw();
		positions = null;
	}
});
$("#datetimeselected").click(onDateSelected);
$("#btnPlay").click(function(){timeSelect.play(0.1)});
$("#btnStop").click(function(){timeSelect.stop()});
