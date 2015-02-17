/// <reference path="Scripts/typings/express/express.d.ts" />
/// <reference path="Scripts/typings/body-parser/body-parser.d.ts" />
/// <reference path="Scripts/typings/request/request.d.ts"/>

import express = require('express');
import bodyParser = require('body-parser');
import request = require('request')

var POS_SERVER = "http://127.0.0.1:9000/rawWifi"
var app = express();
var port = 8000;

var recievedBlobs: any[] = [];

app.use(bodyParser.json());

app.post('/drone', function (req: express.Request, res: express.Response) {
	if (req.body.data.length > 0) {
		recievedBlobs.push(req.body);
	}
	
	res.sendStatus(200);
});

console.log("Queen Running...");
app.listen(port);

setInterval(function () {
	var blobsToSend = recievedBlobs
	var blogStr = JSON.stringify(blobsToSend);
	recievedBlobs = [];
	if (blobsToSend.length > 0) {

		request(
		{
			method: 'POST',
			uri: POS_SERVER,
			form:
			{
				wifiData: blobsToSend
			},
			json: true
		},
			function (err, res, body) {
				if (err) {
					console.error("Failed to send position data to server : " + err);
				}
		});
	}
}, 2500);