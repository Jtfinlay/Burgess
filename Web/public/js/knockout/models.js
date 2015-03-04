/**
 *	Employee {
 *		firstName: String,
 *		lastName: String,
 *		mac: String,
 *		auth_token: String
 *	}
 */
function Employee(data) {
	var self = this;
	data = data || {};

	self.firstName = ko.observable(data.firstName);
	self.lastName = ko.observable(data.lastName);
	self.auth_token = ko.observable(data.auth_token || generateID());
	self.mac = ko.observable(data.mac);

	self.renew_token = function() {
		self.auth_token(generateID());
	};

}

/*
 *	In no way is this guaranteed unique.
 */
var generateID = function() {
    var d = new Date().getTime();
    var uuid = 'xyx-xxx-3xxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

