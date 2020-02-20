const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const setupSockets = require('./sockets')

const setupServer = () => {

	// Serve client files
	app.use(express.static(__dirname + '/../client/'));

	// Default server port to 8080
	const port = process.env.PORT || 8080;

	server.listen(port);

	console.log("server is listening on port", port);

	let Players = {}, Rooms = [];

	// Setup socket.io connections
	setupSockets(io, Players, Rooms)


	// Game updates

	function Update() {
		Rooms.forEach(function (element) {
			if (element.active) {
				element.Update(Players);
			}
		});
	}

	function OutputServerInfo() {
		console.log("Players:");
		let string = "";
		for (let id in Players) {
			string = string + ": " + Players[id].username;
		}
		console.log(string);
		console.log("Rooms: ");
		Rooms.forEach(elem => {
			console.log(elem.name + ": " + elem.players.length + " players");
		});
	}

	setInterval(Update, 1000 / 30);
	setInterval(OutputServerInfo, 30000);
}

module.exports = setupServer