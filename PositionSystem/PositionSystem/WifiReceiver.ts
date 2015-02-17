/// <reference path="Scripts/typings/express/express.d.ts" />
/// <reference path="Scripts/typings/body-parser/body-parser.d.ts" />

import express = require('express');
import bodyParser = require('body-parser');

interface RawWifiEntry {
	mac: string;
	strength: number;
	time: string;
}

interface DroneData {
	id: string;
	data: RawWifiEntry[];
}

interface RawWifiData {
	wifiData: DroneData[];
}

export class Receiver {

	run(): void {
		var app = express();
		var port = 9000;

		app.use(bodyParser.urlencoded(
			{
				extended: true
			}));
		app.use(bodyParser.json());


		app.post('/rawWifi', function (req: express.Request, res: express.Response) {
			var raw = <RawWifiData>req.body;
			console.log("Rx'ed raw wifi data");
			res.sendStatus(200);
		});

		console.log("Gathering Wifi Raw Data...");
		app.listen(port);
	}
}