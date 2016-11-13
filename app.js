/*jshint esversion: 6 */

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static(__dirname + '/client/'));
app.get('/', function(req, res, next) {
  res.sendFile(__dirname + '/client/index.html');
});

const port = 8080;
server.listen(port);
console.log("server is listening on port", port);

let Piece = function (x = 5, y = 0) {
  this.matrix = GetPiece();
  this.x = x - Math.floor(this.matrix[0].length / 2);
  this.y = y;
};

let Players = {};
let Rooms = [];

io.on('connection', function (socket) {
  console.log('Client connected with ID:', socket.id);
  let clientid = socket.id;
  Players[clientid] = {};
  Players[clientid].id = socket.id;
  let clientroom;
  socket.emit('registerrequest', clientid);

  socket.on('register', function (data) {
    Players[clientid].username = data.username;
    clientroom = ConnectToRoom(clientid);
    socket.join(clientroom.name);
    io.to(clientroom.name).emit('playerlist', clientroom.players);
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
    } catch(err) {
    }
  });

  socket.on('startgame', function () {
      clientroom.Start();
  });

  socket.on('disconnect', function () {
    console.log("Client disconnected with ID:", socket.id);
    DisconnectFromRoom(clientid);
    delete clientroom.tetris[Players[clientid]];
    delete Players[clientid];
    io.to(clientroom.name).emit('playerlist', clientroom.players);
  });
});

const piecematrix = [];
piecematrix[0] = [
  [1, 0],
  [1, 1],
  [1, 0]
];
piecematrix[1] = [
  [2, 2],
  [2, 0],
  [2, 0]
];
piecematrix[2] = [
  [3, 0],
  [3, 0],
  [3, 3]
];
piecematrix[3] = [
  [0, 4],
  [4, 4],
  [4, 0]
];
piecematrix[4] = [
  [5, 5],
  [5, 5]
];
piecematrix[5] = [
  [0, 6],
  [0, 6],
  [0, 6],
  [0, 6]
];
piecematrix[6] = [
  [7, 0],
  [7, 7],
  [0, 7]
];

function GetPiece() {
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

function DisconnectFromRoom(id) {
  for (let i = 0; i < Rooms.length; i++) {
    for (let p = 0; p < Rooms[i].players.length; p++) {
      if (Rooms[i].players[p].id === id) {
        let indx = Rooms[i].players.indexOf(Rooms[i].players[p]);
        Rooms[i].players.splice(indx, 1);
      }
    }
  }
}

// tetris is an object holding all current instances in a 'room'
let tetris = {};

class RoomClass {
  constructor () {
    this.tetris = {};
    this.players = [];
    this.active = false;
    this.name = ((Math.random() * 10000) | 0).toString();
  }
  Start () {
    if (this.players.length === 0 || this.active) return false;
    this.active = true;
    this.tetris = {};
    for (let i = 0; i < this.players.length; i++) {
      this.tetris[this.players[i].id] = new Player(new Tetris());
    }
    io.to(this.name).emit('initgame', { width: 10, height: 20, players: this.players.length });
  }
  Update() {
    let lived = false;
    for (let id in this.tetris) {
      if (this.tetris[id].live) {
        this.tetris[id].TickPiece();
        lived = true;
      }
    }
    if (!lived) this.Stop();
    this.SendPackets();
  }
  Stop() {
    console.log("Stop");
    this.active = false;
  }
  SendPackets() {
    let deliver = {};
    for (let id in this.tetris) {
      deliver[id] = {};
      deliver[id].matrix = this.tetris[id].DrawMatrix();
      deliver[id].pieceQueue = this.tetris[id].pieceQueue;
      deliver[id].score = this.tetris[id].score;
    }
    io.to(this.name).emit('packet', deliver);
  }
}

let arenaWidth = 10, arenaHeight = 20;
class Tetris {
  constructor() {
    this.width = arenaWidth;
    this.height = arenaHeight;
    this.ClearMatrix();
  }
  Init() {
    this.score = 0;
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
  constructor(tetris = new Tetris()) {
    this.droprate = 1000;
    this.tetris = tetris;
    this.matrix = tetris.matrix;
    this.score = 0;
    this.lastTime = Date.now();
    this.dropCounter = 0;
    this.live = true;
    this.piece = [];
    this.pieceQueue = [];
    this.NewPiece();
  }
  NewPiece () {
    while (this.pieceQueue.length < 6) {
      this.pieceQueue.push(new Piece(this.tetris.width / 2));
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
    toDeliver = this.DrawPiece(toDeliver);
    return toDeliver;
  }
  // Move piece
  MovePiece(x, y) {
    if (!y) y = 0;
    if (!this.CheckForCollision(this.piece, this.piece.x + x, this.piece.y + y)) {
      this.piece.x += x;
      this.piece.y += y;
    }
  }
  // takes in a piece of any size, rotates it 90 degrees clockwise and then returns as an array
  RotatePiece90() {
    let n = this.piece.matrix.length;
    let n2 = this.piece.matrix[0].length;
    let pp = {};
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
    if (this.CheckForCollision(this.piece, this.piece.x, this.piece.y + y)) {
      this.ApplyToMatrix();
    } else {
      this.piece.y += 1;
    }
    this.dropCounter = 0;
  }
  MoveToBottom() {
    while (!this.CheckForCollision(this.piece, this.piece.x, this.piece.y)) {
      this.piece.y++;
    }
    this.piece.y -= 1;
    this.ApplyToMatrix();
    this.dropCounter = 0;
  }
  TickPiece() {
    if (this.live) {
      let dt = Date.now() - this.lastTime;
      this.time =
      this.lastTime = Date.now();
      this.dropCounter += dt;
      if (this.dropCounter > this.droprate) {
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
    if (this.CheckForCollision(this.piece, this.piece.x, this.piece.y)) this.Init();
  }
  Init() {
    this.piece = null;
    this.live = false;
  }
  CheckForFullRows() {
    for (let i = 0; i < this.tetris.height; i++) {
      for (let j = 0; j < this.tetris.width; j++) {
        if (this.matrix[j][i] === 0) break;
        else if (j === this.tetris.width - 1) this.ClearRow(i);
      }
    }
  }
  ClearRow(row) {
    let i = this.tetris.width;
    while (i-- > 0) {
      this.matrix[i].splice(row, 1);
      this.matrix[i].unshift(0);
    }
    this.score += 100;
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
}

function Update() {
  Rooms.forEach(function (element) {
    if (element.active) {
      element.Update();
    }
  });
  for (let id in tetris) {
    tetris[id].TickPiece();
  }
}

setInterval(Update, 100);
