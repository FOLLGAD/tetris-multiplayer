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

let Piece = function (x, y) {
  this.matrix = getMatrix();
  this.x = x - Math.floor(this.matrix[0].length/2);
  this.y = y;
};

let movingUp = false, movingLeft = false, movingDown = false, movingRight = false;

io.on('connection', function (socket) {
  console.log("Client connected with ID:", socket.id);
  socket.on('key', function (input) {
    if (input.state) {
      switch(input.inputkey) {
        case 'w':
          Player1.matrix = rotatePiece(Player1);
          movingUp = input.state;
          break;
        case 'a':
          movePiece(Player1, -1);
          movingLeft = input.state;
          break;
        case 's':
          movingDown = input.state;
          break;
        case 'd':
          movePiece(Player1, 1);
          movingRight = input.state;
          break;
      }
    }
  });
});

let matrix = [];
const piecematrix = [];
  piecematrix[0] = [
    [0, 0, 0],
    [1, 1, 1],
    [0, 1, 0]
    ];
  piecematrix[1] = [
    [2, 0, 0],
    [2, 2, 2],
    [0, 0, 0]
  ];
  piecematrix[2] = [
    [0, 0, 3],
    [3, 3, 3],
    [0, 0, 0]
  ];

  function getMatrix() {
    return piecematrix[Math.floor( Math.random() * 3 )];
  }

// Defines the play area
let arenaWidth = 20, arenaHeight = 40;

let Player1, Player2;

// creates an array filled with 0's, whose size is depending on the arenaWidth & arenaHeight variables
function initialize() {
  for (let i = 0; i < arenaWidth; i++) {
    matrix.push([]);
    for (let j = 0; j < arenaHeight; j++) {
      matrix[i].push(0);
    }
  }
  Player1 = new Piece(arenaWidth / 2, 0);
  matrix[0][0] = 3;
  matrix[0][1] = 2;
}

// Draws the piece onto the matrix and returns the outcome
function drawMatrix() {
  let toDeliver = [];
  let i = matrix.length;
  while(i--) {
    toDeliver[i] = [];
    let o = matrix[i].length;
    while(o--) {
      toDeliver[i][o] = matrix[i][o];
    }
  }
  toDeliver = drawPiece(Player1, toDeliver);
  return toDeliver;
}

// takes a piece and outputs it on the matrix
function drawPiece(piece, targetMatrix) {
  for (let i = piece.x; i < piece.matrix.length + piece.x; i++) {
    for (let j = piece.y; j < piece.matrix[i - piece.x].length + piece.y; j++) {
      if (piece.matrix[j - piece.y][i - piece.x] !== 0) {
        targetMatrix[i][j] = piece.matrix[j - piece.y][i - piece.x];
      }
    }
  }
  return targetMatrix;
}

// Checks if the piece would obstruct anything if it were to move x, y amount of steps
function checkForCollision(piece, x, y) {
  for (let i = x; i < piece.matrix.length + x; i++) {
    for (let j = y; j < piece.matrix[i - x].length + y; j++) {
      if (piece.matrix[j - y][i - x] !== 0) {
        if (typeof matrix[i] == 'undefined' || typeof matrix[i][j] == 'undefined') {
          return true;
        }
        else if (matrix[i][j] !== 0 && piece.matrix[j - y][i - x] !== 0) {
          return true;
        }
      }
    }
  }
  return false;
}

function movePiece(piece, x) {
  if (!checkForCollision(piece, piece.x + x, piece.y)) {
    piece.x += x;
  }
}

// takes in a piece of any size, rotates it 90 degrees clockwise and then returns as an array
function rotatePiece(piece) {
  let n = piece.matrix.length;
  let pp = {};
  pp.matrix = [];
  for (let i = 0; i < n; i++) {
    pp.matrix.push([]);
    for (let j = 0; j < n; j++) {
      pp.matrix[i].push(piece.matrix[n - j - 1][i]);
    }
  }
  if (!checkForCollision(pp, piece.x, piece.y)) return pp.matrix;
  else return piece.matrix;
}
// Removes the piece and instead applies it to the background
function applyToMatrix(piece) {
  for (let i = piece.x; i < piece.matrix.length + piece.x; i++) {
    for (let j = piece.y; j < piece.matrix[i - piece.x].length + piece.y; j++) {
      if (piece.matrix[j - piece.y][i - piece.x] !== 0) {
        matrix[i][j] = piece.matrix[j - piece.y][i - piece.x];
      }
    }
  }
  Player1 = new Piece(arenaWidth / 2, 0);
}

let tickInc = 0;

function tickPiece(piece) {
  let inc = 1;
  if (tickInc++ > 5) {
    if (checkForCollision(piece, piece.x, piece.y + inc)) {
      applyToMatrix(piece);
    }
    tickInc = 0;
    piece.y += 1;
  }
}

let consoletick = 0;

function update() {
  tickPiece(Player1);
  SendPacket();
}

function SendPacket() {
  let deliver = drawMatrix();
  io.emit('packet', { matrix: deliver });
}

initialize();
setInterval(update, 100);
