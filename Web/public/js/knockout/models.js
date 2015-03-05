/**
 *	Employee {
 *		_id: {"$oid": ... },
 *		retailer: {"$oid": ... },
 *		name: String,
 *		mac: String,
 *		auth_code: String
 *	}
 */
function Employee(data) {
	var self = this;
	data = data || {};

	self._id = data._id;
	self.retailer = data.retailer;
	self.name = ko.observable(data.name);
	self.auth_code = ko.observable(data.auth_code || generateID());
	self.mac = ko.observable(data.mac);

	self.renew_token = function() {
		self.auth_code(generateID());
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

