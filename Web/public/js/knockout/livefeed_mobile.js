var drawableExpired = 5*1000;

function LiveFeedViewModel() {
	var self = this;

	self.employees = ko.observableArray();
	self.employees_all = [];
	self.customers = ko.observableArray();

	self.update = function(drawables) {
		drawables = drawables || [];

		// Update values
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
		});

		// Remove old values
		self.customers($.grep(self.customers(), function(d,i) {
			return ((new Date()).getTime() - d.lastUpdated < drawableExpired);
		}));
		self.employees($.grep(self.employees(), function(d,i) {
			return ((new Date()).getTime() - d.lastUpdated < drawableExpired);
		}));
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
		var data = '[{"_id":{"$oid": "54f79825429707aee3571d8c"},"retailer":{"$oid": "54f28084c06cba6f3c973e44"},"name":"James Finlay","auth_code":"18a-943-3350","mac":"40:B0:FA:68:39:0C"},{"_id":{"$oid": "54f79879429707aee3571d8d"},"retailer":{"$oid": "54f28084c06cba6f3c973e44"},"name":"Jesse Tucker","auth_code":"da7-866-3a60","mac":"C0:EE:FB:25:F9:B6"},{"_id":{"$oid": "54f79879429707aee3571d8e"},"retailer":{"$oid": "54f28084c06cba6f3c973e44"},"name":"Tyler Meen","auth_code":"8a1-66a-358a","mac":"50:CC:F8:D9:F8:D7"}]'
		self.employees_all = [];
		$.each(JSON.parse(data), function(i, employee) {
			self.employees_all.push(employee);
		});
	}
}

var vm = new LiveFeedViewModel();
$(function() {
	ko.applyBindings(vm);
})

/** RETAIL MAP **/
var map = new LiveMap("live_map", 13.26, 12.24, "/images/store_layout.png");

var refreshMapData = function() {
	var self = this;
	$.get("livefeed_mobile/data", function(result) {
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
