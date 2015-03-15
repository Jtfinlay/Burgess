/** RETAIL MAP **/
var map;
$.get("map/size", function(result) {
    var details = JSON.parse(result);
    map = new LiveMap("live_map", details.width, details.height, details.store_img);
});

var refreshMapData = function() {
    dataBlock.requestData_Live(function() {
        if (!map) return;
		var positions = dataBlock.getUserPositions((new Date()).getTime());
        // console.log((new Date()).getTime() - parseInt(Object.keys(dataBlock.data)[0]))
        $.each(positions, function(i,d) {
            map.addCustomer(d.x, d.y, d.radius, d.priority, d.employee);
        });
        map.draw();
        positions = null;

    })
}

var dataBlock = new PositionBlock();
refreshMapData();
var timer = setInterval(function() {
    refreshMapData();
}, 1000)
