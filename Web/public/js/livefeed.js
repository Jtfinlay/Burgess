/** RETAIL MAP **/
var map;
$.get("map/size", function(result) {
    var details = JSON.parse(result);
    map = new LiveMap("live_map", details.width, details.height, details.store_img);
});

var refreshMapData = function() {
    dataBlock.requestData_Live(function(result) {
		var positions = dataBlock.getUserPositions((new Date()).getTime());
        $.each(positions, function(i,d) {
            map.addCustomer(d.x, d.y, d.radius, d.priority);
        });
        map.draw();
        positions = null;

    })
}

var timer = setInterval(function() {
    refreshMapData();
}, 6000)

var dataBlock = new PositionBlock();
