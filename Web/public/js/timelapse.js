/** DATE TIME PICKER **/
$("#datetimepicker").datetimepicker({
	format: 'm-d-Y',
	lang:'en',
	timepicker:false,
	defaultDate: '2012/04/23'
});


/** RETAIL MAP **/
var map = new LiveMap("live_map", 600, 400);
map.loadResources();

/** LOGIC **/
function onDateSelected() {
    dataBlock.requestData(($("#datetimepicker").val()+"-"+(new Date).getTimezoneOffset()),
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
dataBlock.requestData(formatDate(new Date)+"-"+(new Date).getTimezoneOffset(), function (result) {
	timeSelect.drawChart("#chart", [{values: dataBlock.getCustomersHourly(), key: "Customers"}]);
	timeSelect.drawSelector("#time");
	timeSelect.selectorMoved = function(x) {
		var t = timeSelect.xi + x * (timeSelect.xf - timeSelect.xi);
		$.each(dataBlock.getUserPositions(t), function(i,d) {
			map.addCustomer(d.x, d.y, 10);
		});
		map.draw();
	}
});
$("#datetimeselected").click(onDateSelected);
$("#btnPlay").click(function(){timeSelect.play(1)});
$("#btnStop").click(function(){timeSelect.stop()});

