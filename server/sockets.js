const Room = require('./game/room.js')

const setupSockets = (io, Players, Rooms) => {
	io.on('connection', function (socket) {

		console.log('Client connected with ID:', socket.id);
		let clientId = socket.id;
		Players[clientId] = {};
		Players[clientId].id = socket.id;
		Players[clientId].identity = Math.random() * 100000 | 0;
		let clientroom;
		socket.emit('registerrequest', { clientId, identity: Players[clientId].identity });


		socket.on('register', function (username) {
			if (clientroom) DisconnectFromRoom(Rooms, clientId, clientroom);
			Players[clientId].username = username;
		});

		socket.on('joinroom', function (roomname) {
			if (clientroom) DisconnectFromRoom(Rooms, clientId, clientroom);
			if (roomname === -1)
				clientroom = ConnectToNewRoom(io, Rooms, Players, clientId);
			else
				clientroom = ConnectToRoomID(Rooms, Players, clientId, roomname, socket);
			if (!!clientroom && "name" in clientroom) {
				socket.join(clientroom.name);
				io.to(clientroom.name).emit('playerlist', clientroom.players);
			}
		});

		socket.on('chat-msg', function (message) {
			if (!!clientroom && "name" in clientroom)
				io.to(clientroom.name).emit('chat-msg', { message, username: Players[clientId].username });
			console.log(Players[clientId].username + ":", message);
		});

		socket.on('key', function (input) {
			try {
				switch (input.inputkey) {
					case 'w':
						clientroom.tetris[clientId].RotatePiece90();
						break;
					case 'a':
						clientroom.tetris[clientId].MovePiece(-1);
						break;
					case 's':
						clientroom.tetris[clientId].MoveDown(1);
						break;
					case 'd':
						clientroom.tetris[clientId].MovePiece(1);
						break;
					case 'space':
						clientroom.tetris[clientId].MoveToBottom();
						break;
					case 'rotate90':
						clientroom.tetris[clientId].RotatePiece90();
						break;
					case 'rotateminus90':
						clientroom.tetris[clientId].RotatePieceMinus90();
						break;
				}
			} catch (err) {
				console.log("cant move piece");
			}
		});
		socket.on('startgame', () => {
			if (clientroom) {
				clientroom.Start(Players);
			}
		});

		socket.on('requestrooms', () => {
			if (clientroom) DisconnectFromRoom(Rooms, clientId, clientroom);
			let rooms = [];
			Rooms.forEach(element => {
				let obj = {};
				obj.name = element.name;
				obj.players = element.players.length;
				rooms.push(obj);
			});
			socket.emit('roominfo', rooms);
		});

		socket.on('disconnect', () => {
			console.log("Client disconnected with ID:", socket.id);
			delete Players[clientId];
			if (clientroom) {
				DisconnectFromRoom(Rooms, clientId, clientroom);
				io.to(clientroom.name).emit('playerlist', clientroom.players);
			}
		});
	});
}

function ConnectToRoomID(Rooms, Players, id, roomnumber, socket) {
	for (let room = 0; room < Rooms.length; room++) {
		if (roomnumber == Rooms[room].name) {
			Rooms[room].players.push(Players[id]);
			if (Rooms[room].active) {
				let deliver = [];
				for (let id in Rooms[room].tetris) {
					const i = deliver.push({}) - 1;
					deliver[i].score = Rooms[room].tetris[id].score;
					deliver[i].username = Rooms[room].tetris[id].username;
					deliver[i].identity = Rooms[room].tetris[id].identity;
				}
				socket.emit('initgame', { width: 10, height: 20, players: deliver });
			}
			return Rooms[room];
		}
	}
	console.log("could not find room", roomnumber);
}

function ConnectToNewRoom(io, Rooms, Players, id) {
	let index = Rooms.push(new Room(io));
	Rooms[index - 1].players.push(Players[id]);
	Rooms[index - 1].owner = Players[id];
	return Rooms[index - 1];
}

function DisconnectFromRoom(Rooms, id, room) {
	if (id === room.owner) room.owner = room.players[0].id;
	for (let p = 0; p < room.players.length; p++) {
		if (room.players[p].id === id) {
			if (id in room.tetris)
				room.tetris[id].Death();
			room.players.splice(p, 1);
			if (room.players.length <= 0) Rooms.splice(Rooms.indexOf(room), 1);
			return;
		}
	}
}


module.exports = setupSockets