function SettingsViewModel() {
	var self = this;

	self.employees_def = [];
    self.employees = ko.observableArray();
    self.removed = [];

	self.pullData = function() {
		$.get("/employees", function (data) {
			self.employees([]);
			self.employees_def = [];
			self.removed = [];

			$.each(JSON.parse(data), function(i, employee) {
				self.employees_def.push(employee);
				self.employees.push(new Employee(employee));
			});
		});
	};

	self.updated = ko.computed(function() {
		return !(JSON.stringify(self.employees_def) == ko.toJSON(self.employees()));
	});
	self.removeEmployee = function(employee) {
		self.removed.push(employee);
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
		$.post("/employees", {
			"update": ko.toJSON(self.employees()),
			"remove": ko.toJSON(self.removed)
		}, function() {self.pullData();});
	};

	self.pullData();

}

$(function() {
	ko.applyBindings(new SettingsViewModel());
});
