$.post("/analytics/helpCount",
    {"ti":1426118400000, "tf":1426204800000},
    function(result) { console.log("Count:" + result); }
);
$.post("analytics/helpTime",
    {"ti":1426118400000, "tf":1426204800000},
    function(result) { console.log("Time:" + result); }
);
