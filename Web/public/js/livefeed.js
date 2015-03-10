/** RETAIL MAP **/
var map;
$.get("map/size", function(result) {
    var details = JSON.parse(result);
    map = new LiveMap("live_map", details.width, details.height, details.store_img);
});

var refreshMapData = function() {
    dataBlock.requestData_Live(function(result) {
        console.log(result);
        // Take each customer and draw
    })
}

var timer = setInterval(function() {
    refreshMapData();
}, 6000)
