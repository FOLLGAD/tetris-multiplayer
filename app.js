/*jshint esversion: 6 */

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

let arenaWidth = 10, arenaHeight = 20;

app.use(express.static(__dirname + '/client/'));
app.get('/', function(req, res, next) {
  res.sendFile(__dirname + '/client/index.html');
});

const port = 8080;
server.listen(port);
console.log("server is listening on port", port);

let Players = {}, Rooms = [];

io.on('connection', function (socket) {
  console.log('Client connected with ID:', socket.id);
  let clientid = socket.id;
  Players[clientid] = {};
  Players[clientid].id = socket.id;
  Players[clientid].identity = Math.random() * 100000 | 0;
  let clientroom;
  socket.emit('registerrequest', { clientid, identity: Players[clientid].identity });

  socket.on('register', function (username) {
    if (!!clientroom) DisconnectFromRoom(clientid, clientroom);
    Players[clientid].username = username;
  });

  socket.on('joinroom', function (roomname) {
    if (!!clientroom) DisconnectFromRoom(clientid, clientroom);
    if (roomname === -1)
      clientroom = ConnectToNewRoom(clientid);
    else
      clientroom = ConnectToRoomID(clientid, roomname, socket);
    if (!!clientroom && "name" in clientroom) {
      socket.join(clientroom.name);
      io.to(clientroom.name).emit('playerlist', clientroom.players);
    }
  });

  socket.on('chat-msg', function (message) {
    if (!!clientroom && "name" in clientroom)
      io.to(clientroom.name).emit('chat-msg', { message, username: Players[clientid].username });
      console.log(Players[clientid].username + ":", message);
  });

  socket.on('key', function (input) {
    try {
      switch(input.inputkey) {
        case 'w':
          clientroom.tetris[clientid].RotatePiece90();
          break;
        case 'a':
          clientroom.tetris[clientid].MovePiece(-1);
          break;
        case 's':
          clientroom.tetris[clientid].MoveDown(1);
          break;
        case 'd':
          clientroom.tetris[clientid].MovePiece(1);
          break;
        case 'space':
          clientroom.tetris[clientid].MoveToBottom();
          break;
        case 'rotate90':
          clientroom.tetris[clientid].RotatePiece90();
          break;
        case 'rotateminus90':
          clientroom.tetris[clientid].RotatePieceMinus90();
          break;
      }
    } catch (err) {
      console.log("cant move piece");
    }
  });
  socket.on('startgame', () => {
    if (!!clientroom) {
      clientroom.Start();
    }
  });

  socket.on('requestrooms', () => {
    if (!!clientroom) DisconnectFromRoom(clientid, clientroom);
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
    delete Players[clientid];
    if (!!clientroom) {
      DisconnectFromRoom(clientid, clientroom);
      io.to(clientroom.name).emit('playerlist', clientroom.players);
    }
  });
});

const NORMALTETRO = [];
  NORMALTETRO[0] = [
    [1, 0],
    [1, 1],
    [1, 0]
  ];
  NORMALTETRO[1] = [
    [2, 2],
    [2, 0],
    [2, 0]
  ];
  NORMALTETRO[2] = [
    [3, 0],
    [3, 0],
    [3, 3]
  ];
  NORMALTETRO[3] = [
    [0, 4],
    [4, 4],
    [4, 0]
  ];
  NORMALTETRO[4] = [
    [5, 5],
    [5, 5]
  ];
  NORMALTETRO[5] = [
    [0, 6],
    [0, 6],
    [0, 6],
    [0, 6]
  ];
  NORMALTETRO[6] = [
    [7, 0],
    [7, 7],
    [0, 7]
  ];
const AUTISMTETRO = [];
  AUTISMTETRO[0] = [
    [0, 1, 0],
    [0, 1, 0],
    [1, 1, 1]
  ];
  AUTISMTETRO[1] = [
    [2, 2, 2],
    [2, 0, 2],
    [2, 0, 2]
  ];
  AUTISMTETRO[2] = [
    [3],
    [3]
  ];
  AUTISMTETRO[3] = [
    [1]
  ];

let piecematrix = NORMALTETRO;

let Piece = function (x, n) {
  this.matrix = piecematrix[n];
  this.x = x - Math.floor(this.matrix[0].length / 2);
  this.y = 0;
};

function GetRandomPiece() {
  return piecematrix[(Math.random() * piecematrix.length) | 0];
}

// "Rooms" is an array, with each consisting of RoomClasses
function ConnectToRoom (id) {
  for (let room = 0; room < Rooms.length; room++) {
    if (!Rooms[room].active) {
      Rooms[room].players.push(Players[id]);
      return Rooms[room];
    }
  }
  Rooms.push(new RoomClass());
  Rooms[Rooms.length - 1].players.push(Players[id]);
  return Rooms[Rooms.length - 1];
}

function ConnectToRoomID (id, roomnumber, socket) {
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

function ConnectToNewRoom (id) {
  let indx = Rooms.push(new RoomClass());
  Rooms[indx - 1].players.push(Players[id]);
  Rooms[indx - 1].owner = Players[id];
  return Rooms[indx - 1];
}

function DisconnectFromRoom(id, room) {
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

// generates a seed that is used to generate the same pieces for all users
const getNewSeed = () => {
  return Math.floor(Math.random() * 100000);
};

class RoomClass {
  constructor () {
    this.tetris = {};
    this.players = [];
    this.active = false;
    this.name = ((Math.random() * 100000) | 0).toString();
    this.winlist = [];
    this.type = 'single';
    this.droprate = 1000;
    this.gameLength = 120*1000;
    this.seed = null;
    // timed mode game length in ms
  }
  Start () {
    if (this.players.length === 0 || this.active) return false;
    if (this.players.length === 1) this.type = 'single';
    else this.type = 'timed';
    this.active = true;
    this.seed = getNewSeed();
    this.tetris = {};
    for (let i = 0; i < this.players.length; i++) {
      this.tetris[this.players[i].id] = new Player(this.seed, this.players[i].username);
    }
    let deliver = [];
    for (let id in this.tetris) {
      const i = deliver.push({}) - 1;
      deliver[i].score = this.tetris[id].score;
      deliver[i].username = Players[id].username;
      deliver[i].identity = Players[id].identity;
    }
    io.to(this.name).emit('initgame', { width: 10, height: 20, players: deliver });
    this.startingTime = Date.now();
    if (this.type == "timed")
      this.endingTime = Date.now() + this.gameLength;
  }
  CheckWinner() {
    let winner, scores = [];
    for (let id in this.tetris) {
      if (!this.tetris[id].live) continue;
      scores.push({id, score: this.tetris[id].score});
    }
    scores.sort((a, b) => {
      return b.score - a.score;
    });
    if (!!scores[1] && scores[0].score !== scores[1].score)
      winner = Players[scores[0].id].username;
    else if (!!scores[0] && scores.length === 1)
      winner = Players[scores[0].id].username;
    this.Stop(winner);
  }
  ScoreList() {
    let scores = [];
    for (let id in this.tetris) {
      scores.push({ username: this.tetris[id].username, score: this.tetris[id].score });
    }
    scores.sort((a, b) => {
      return b.score - a.score;
    });
    return scores;
  }
  Update() {
    if (this.type == 'timed' && Date.now() > this.endingTime) {
      this.CheckWinner();
      return;
    }
    let dt = Date.now() - this.startingTime;
    let level = (dt / 20000) | 0;
    let speed = ((1 + 0.1 * level) * 100) | 0;
    let livecount = [];
    for (let id in this.tetris) {
      if (this.tetris[id].live) {
        this.tetris[id].TickPiece(speed);
        livecount.push(id);
      }
    }
    if (livecount.length === 1 && this.type != 'single') this.Stop(Players[livecount[0]].username);
    else if (livecount.length === 0) this.Stop();
    this.SendPackets();
  }
  Stop() {
    let results = this.ScoreList();
    this.active = false;
    io.to(this.name).emit('gameover', results);
    this.startingTime = 0;
  }
  SendPackets() {
    let timeleft = this.endingTime - Date.now(), deliver = [];
    for (let id in this.tetris) {
      const i = deliver.push({}) - 1;
      deliver[i].matrix = this.tetris[id].DrawMatrix();
      deliver[i].activePiece = this.tetris[id].piece;
      deliver[i].pieceQueue = this.tetris[id].pieceQueue;
      deliver[i].score = this.tetris[id].score;
      deliver[i].live = this.tetris[id].live;
      if (id in Players) {
        deliver[i].username = Players[id].username;
        deliver[i].identity = Players[id].identity;
      }
    }
    if (this.type == 'timed')
      io.to(this.name).emit('packet', { deliver, timeleft });
    else
      io.to(this.name).emit('packet', { deliver });
  }
}

class Tetris {
  constructor() {
    this.width = arenaWidth;
    this.height = arenaHeight;
    this.ClearMatrix();
  }
  Init() {
    this.ClearMatrix();
  }
  ClearMatrix() {
    this.matrix = [];
    for (let i = 0; i < this.width; i++) {
      this.matrix.push([]);
      for (let o = 0; o < this.height; o++) {
        this.matrix[i].push(0);
      }
    }
  }
}
class Player {
  constructor(seed, username) {
    this.n = 0;
    this.seed = seed;
    this.droprate = 1000;
    this.tetris = new Tetris();
    this.matrix = this.tetris.matrix;
    this.score = 0;
    this.dropCounter = 0;
    this.live = true;
    this.piece = null;
    this.pieceQueue = [];
    this.username = username;
    this.NewPiece();
  }
  NewPiece () {
    while (this.pieceQueue.length < 6) {
      this.bag = [];
      while (this.bag.length < 7) {
        this.pieceNumber = this.getPieceNumber();
        if (!isInArray(this.pieceNumber, this.bag)){
          this.bag.push(this.pieceNumber);
        }
      }
      console.log(this.bag);
      for(let i = 0; i < this.bag.length; i++){
        this.pieceQueue.push(new Piece(this.tetris.width / 2, this.bag[i]/*this.getPieceNumber()*/));
      }
    }
    this.piece = this.pieceQueue.splice(0, 1)[0];
  }
  // takes a piece and outputs it on the matrix
  DrawPiece(targetMatrix) {
    if (this.piece !== null) {
      for (let i = 0; i < this.piece.matrix.length; i++) {
        for (let j = 0; j < this.piece.matrix[i].length; j++) {
          if (this.piece.matrix[i][j] !== 0) {
            targetMatrix[i + this.piece.x][j + this.piece.y] = this.piece.matrix[i][j];
          }
        }
      }
    }
    return targetMatrix;
  }
  // Draws the piece onto the matrix and returns the outcome
  DrawMatrix() {
    let toDeliver = [];
    let i = this.matrix.length;
    while(i--) {
      toDeliver[i] = [];
      let o = this.matrix[i].length;
      while(o--) {
        toDeliver[i][o] = this.matrix[i][o];
      }
    }
    return toDeliver;
  }
  // Move piece
  MovePiece(x, y) {
    if (!this.live) return;
    if (!y) y = 0;
    if (!this.CheckForCollision(this.piece, this.piece.x + x, this.piece.y + y)) {
      this.piece.x += x;
      this.piece.y += y;
    }
  }
  // takes in a piece of any size, rotates it 90 degrees clockwise and then returns as an array
  RotatePiece90() {
    if (!this.live) return;
    let n = this.piece.matrix.length, n2 = this.piece.matrix[0].length, pp = {};
    pp.matrix = [];
    for (let i = 0; i < n2; i++) {
      pp.matrix.push([]);
      for (let j = 0; j < n; j++) {
        pp.matrix[i].push(this.piece.matrix[j][n2 - i - 1]);
      }
    }
    if (!this.CheckForCollision(pp, this.piece.x, this.piece.y)) this.piece.matrix = pp.matrix;
    else if (!this.CheckForCollision(pp, this.piece.x - 1, this.piece.y)) {
      this.piece.x += -1;
      this.piece.matrix = pp.matrix;
    }
    else if (!this.CheckForCollision(pp, this.piece.x + 1, this.piece.y)) {
      this.piece.x += 1;
      this.piece.matrix = pp.matrix;
    }
    else if (!this.CheckForCollision(pp, this.piece.x, this.piece.y - 1)) {
      this.piece.y += -1;
      this.piece.matrix = pp.matrix;
    }
    else if (!this.CheckForCollision(pp, this.piece.x, this.piece.y + 1)) {
      this.piece.y += 1;
      this.piece.matrix = pp.matrix;
    }
  }
  RotatePieceMinus90() {
    if (!this.live) return;
    let n = this.piece.matrix.length;
    let n2 = this.piece.matrix[0].length;
    let pp = {};
    pp.matrix = [];
    for (let i = 0; i < n2; i++) {
      pp.matrix.push([]);
      for (let j = 0; j < n; j++) {
        pp.matrix[i].push(this.piece.matrix[n - j - 1][i]);
      }
    }
    if (!this.CheckForCollision(pp, this.piece.x, this.piece.y)) this.piece.matrix = pp.matrix;
    else if (!this.CheckForCollision(pp, this.piece.x - 1, this.piece.y)) {
      this.piece.x += -1;
      this.piece.matrix = pp.matrix;
    }
    else if (!this.CheckForCollision(pp, this.piece.x + 1, this.piece.y)) {
      this.piece.x += 1;
      this.piece.matrix = pp.matrix;
    }
    else if (!this.CheckForCollision(pp, this.piece.x, this.piece.y - 1)) {
      this.piece.y += -1;
      this.piece.matrix = pp.matrix;
    }
    else if (!this.CheckForCollision(pp, this.piece.x, this.piece.y + 1)) {
      this.piece.y += 1;
      this.piece.matrix = pp.matrix;
    }
  }
  MoveDown(y) {
    if (!this.live) return;
    if (this.CheckForCollision(this.piece, this.piece.x, this.piece.y + y)) {
      this.ApplyToMatrix();
    } else {
      this.piece.y += 1;
    }
    this.dropCounter = 0;
  }
  MoveToBottom() {
    if (!this.live) return;
    while (!this.CheckForCollision(this.piece, this.piece.x, this.piece.y)) {
      this.piece.y++;
    }
    this.piece.y -= 1;
    this.ApplyToMatrix();
    this.dropCounter = 0;
  }
  TickPiece(dt) {
    if (this.live) {
      this.dropCounter += dt;
      while (this.dropCounter > this.droprate) {
        this.MoveDown(1);
        this.dropCounter -= this.droprate;
      }
    }
  }
  // Removes the piece and instead applies it to the background
  ApplyToMatrix() {
    let count = 0;
    for (let i = 0; i < this.piece.matrix.length; i++) {
      for (let j = 0; j < this.piece.matrix[i].length; j++) {
        if (this.piece.matrix[i][j] !== 0) {
          this.matrix[i + this.piece.x][j + this.piece.y] = this.piece.matrix[i][j];
        }
      }
    }
    this.CheckForFullRows();
    this.NewPiece();
    if (this.CheckForCollision(this.piece, this.piece.x, this.piece.y)) this.Death();
  }
  Death() {
    this.live = false;
  }
  CheckForFullRows() {
    let rowscleared = 0;
    for (let i = 0; i < this.tetris.height; i++) {
      for (let j = 0; j < this.tetris.width; j++) {
        if (this.matrix[j][i] === 0) break;
        else if (j === this.tetris.width - 1) {
          this.ClearRow(i);
          rowscleared++;
        }
      }
    }

    if (rowscleared === 1 || rowscleared === 2 || rowscleared === 3 || rowscleared === 4){
      this.combo++;
    } else this.combo = 0;

    if (rowscleared === 1) this.score += 40 * this.combo;
    else if (rowscleared === 2) this.score += 100 * this.combo;
    else if (rowscleared === 3) this.score += 300 * this.combo;
    else if (rowscleared === 4) this.score += 1200 * this.combo;
  }
  ClearRow(row) {
    let i = this.tetris.width;
    while (i-- > 0) {
      this.matrix[i].splice(row, 1);
      this.matrix[i].unshift(0);
    }
  }
  // Checks if the piece would obstruct anything if it were to move x, y amount of steps
  CheckForCollision(piece, x, y) {
    for (let i = 0; i < piece.matrix.length; i++) {
      for (let j = 0; j < piece.matrix[i].length; j++) {
        if (piece.matrix[i][j] !== 0) {
          if (typeof this.matrix[i + x] == 'undefined' || typeof this.matrix[i + x][j + y] == 'undefined') {
            return true;
          }
          else if (this.matrix[i + x][j + y] !== 0 && piece.matrix[i][j] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  }
  getPieceNumber() {
    let x = Math.sin(this.seed + this.n) * 1000000;
    this.n++;
    return ((x - Math.floor(x)) * 7) | 0;
  }
}

function Update() {
  Rooms.forEach(function (element) {
    if (element.active) {
      element.Update();
    }
  });
}

setInterval(Update, 1000/30);

setInterval(OutputServerInfo, 30000);

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
function isInArray(value, array) {
  return array.indexOf(value) > -1;
}
