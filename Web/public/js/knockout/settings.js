function SettingsViewModel() {
	var self = this;

	self.employees_def = [];
	self.employees = ko.observableArray();
	
	$.get("/employees", function (data) {
		$.each(JSON.parse(data), function(i, employee) {
			self.employees_def.push(
			{
				"name": employee["name"],
				"auth_token": employee["auth_code"],
				"mac": employee["mac"]
			});
		});

		$.each(self.employees_def, function(key, val) {
        	self.employees.push(new Employee(val));
    	});
	});

	self.updated = ko.computed(function() {
		return !(JSON.stringify(self.employees_def) == ko.toJSON(self.employees()));
	});
	self.removeEmployee = function(employee) {
		self.employees.remove(employee);
	};

	self.new_name = ko.observable();
	self.addCustomer = function() {
		self.employees.push(new Employee({
			name: self.new_name(),
			mac: ""}));
		self.new_name("");
	};

	self.store = function() {
		console.log("TODO");
	}

}

$(function() {
	ko.applyBindings(new SettingsViewModel());
});
