/** DATE TIME PICKER **/
$("#datetimepicker").datetimepicker({
	format: 'm-d-Y',
	lang:'en',
	timepicker:false,
	defaultDate: '2012/04/23'
});


/** RETAIL MAP **/
var map = new LiveMap("live_map", 600, 400);
map.addCustomer(70,30,8);
map.addCustomer(40,370,10);
map.addCustomer(300,20,12);
map.loadResources();

/** LOGIC **/
function onDateSelected() {
    dataBlock.requestData(($("#datetimepicker").val()+"-"+(new Date).getTimezoneOffset()),
    function() {
        timeSelect.updateChart([{key: "Customers", values: dataBlock.getCustomersHourly()}]);
    });
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
		$.each(dataBlock.getMostRecent(t-20000,t), function(i,d) {
			map.addCustomer(d.x, d.y, 10);
		});
		map.draw();
	}
});
$("#datetimeselected").click(onDateSelected);


