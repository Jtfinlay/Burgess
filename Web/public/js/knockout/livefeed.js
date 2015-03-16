function LiveFeedViewModel() {
	var self = this;

	self.employees = ko.observableArray();
	self.employees_all = [];
	self.customers = ko.observableArray();

	self.update = function(drawables) {
		$.each(drawables, function(i,d) {
			var exist_array = d.employee ? self.employees : self.customers;
			var existing = $.map(exist_array(), function(e,i) {
				if (d.id() == e.id()) { return i; }
			})[0];

			d.lastUpdated = (new Date()).getTime();
			if (existing == null) {
				exist_array.push(d);
				self.mapEmployeeNames();
			} else {
				exist_array()[existing].update(d);
			}
		})
	}

	self.mapData = function(result) {
		var data = {};
		$.each(result, function(index, v) {
			data[v.t] = [];
			$.each(v.data, function(index, e) {
				data[v.t].push(new Drawable(e));
			})
		})
		return data;
	}

	self.pullEmployees = function(result) {
		$.get("/employees", function (data) {
			self.employees_all = [];
			$.each(JSON.parse(data), function(i, employee) {
				self.employees_all.push(employee);
			});
			self.mapEmployeeNames();
		});
	}

	self.mapEmployeeNames = function() {
		$.each(self.employees_all, function(i,employee) {
			var found = $.grep(self.employees(), function(e,i) {return e.id() == employee.mac})[0];
			if (found != null) { found.name(employee.name); }
		});
		self.employees.valueHasMutated();
	}
}

var vm = new LiveFeedViewModel();
$(function() {
	ko.applyBindings(vm);
})

/** RETAIL MAP **/
var map;
$.get("map/size", function(result) {
    var details = JSON.parse(result);
    map = new LiveMap("live_map", details.width, details.height, details.store_img);
});
var fart;
var refreshMapData = function() {
	var self = this;
	$.get("livefeed/data", function(result) {
		var hash = vm.mapData(JSON.parse(result));
		var drawables = hash[Math.max.apply(Math,Object.keys(hash))];
		vm.update(drawables);
		if (map == null) return;
		map.draw(vm.employees().concat(vm.customers()));
	});
}

refreshMapData();
vm.pullEmployees();
var timer = setInterval(function() {
    refreshMapData();
}, 1000)
