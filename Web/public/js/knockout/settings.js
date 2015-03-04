function SettingsViewModel() {
	var self = this;

	self.employees_def = [
		{
			firstName: "James", 
			lastName: "Finlay", 
			auth_token: "token",
			mac: "40:B0:FA:68:39:0C"
		},
		{
            firstName: "Jesse",
            lastName: "Tucker",
			auth_token: "bbd-e0e-3ab3",
            mac: "C0:EE:FB:25:F9:B6",
        },
		{
            firstName: "Tyler",
            lastName: "Meen",
			auth_token: "8a1-66a-358a",
            mac: "",
        }
	];

	self.employees = ko.observableArray();
	$.each(self.employees_def, function(key, val) {
		self.employees.push(new Employee(val));
	});

	self.updated = ko.computed(function() {
		return !(JSON.stringify(self.employees_def) == ko.toJSON(self.employees()));
	});
	self.removeEmployee = function(employee) {
		self.employees.remove(employee);
	};

	self.new_firstName = ko.observable();
	self.new_lastName = ko.observable();
	self.addCustomer = function() {
		self.employees.push(new Employee({
			firstName: self.new_firstName(),
			lastName: self.new_lastName(),
			mac: ""}));
		self.new_firstName("");
		self.new_lastName("");
	};

	self.store = function() {
		console.log("TODO");
	}

}

$(function() {
	ko.applyBindings(new SettingsViewModel());
});
