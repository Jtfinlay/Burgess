/// <reference path="Scripts/typings/request/request.d.ts"/>

import request = require('request')
import readline = require('readline')

var POS_SERVER = "http://172.28.64.125:9000/rawWifi"
var port = 8000;

console.log("Drone Running...");

var entries = [];

if (process.argv.length == 3) {
	var droneId = process.argv[2];

	var r = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	r.on('line', function (line) {
		var entry = JSON.parse(line);
		if (entry.strength != 0) {
			entries.push(entry);
		}
	});

	// send data to server every 5 seconds
	setInterval(function () {

		if (entries.length == 0) {
			return;
		}

		var entryMap = {};
		entries.forEach(function (entry, index, arr) {
			if (entryMap[entry.mac] != null) {
				entryMap[entry.mac].push(entry.strength);
			}
			else {
				entryMap[entry.mac] = [entry.strength];
			}
		});

		var results = [];

		for (var mac in entryMap) {
			var strengthMeasurments: number[] = entryMap[mac];
			var total = 0;
			strengthMeasurments.forEach(function (val, idx, arr) {
				total += val;
			});
			var average = total / strengthMeasurments.length;
			results.push({ 'mac': mac, 'strength': average, 'time': new Date() });
		}

		entries = [];

		request(
			{
				method: 'POST',
				uri: POS_SERVER,
				form:
				{
					data: { id: droneId, wifiData: results }
				},
				json: true
			},
			function (err, res, body) {
				if (err) {
					console.error("Failed to send position data to server : " + err);
				}
			});

	}, 5000);
}
else {
	console.log("Please supply the drone id as the first arg");
}