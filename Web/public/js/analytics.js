var count;
$.get("/employees",
	function(result) {
		console.log(JSON.parse(result));
	}
);
$.post("/analytics/helpCount",
    {"ti":1426118400000, "tf":1426204800000},
    function(result) { 
		count = JSON.parse(result);
	}
);
$.post("analytics/helpTime",
    {"ti":1426118400000, "tf":1426204800000},
    function(result) { console.log(JSON.parse(result)); }
);
