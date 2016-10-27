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
  io.on('key', function (input) {
    switch(input.inputkey) {
      case 'w':
        rotatePiece(Player1);
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
  });
});

function getMatrix() {
  return piece[Math.floor(Math.random()*3)];
}

let matrix = [];
const piece = [];
  piece[0] = [
    [0, 0, 0],
    [1, 1, 1],
    [0, 1, 0]
    ];
  piece[1] = [
    [2, 0, 0],
    [2, 2, 2],
    [0, 0, 0]
  ];
  piece[2] = [
    [0, 0, 3],
    [3, 3, 3],
    [0, 0, 0]
  ];

let arenaWidth = 20, arenaHeight = 40;

let Player1, Player2;

function initialize() {
  for (let i = 0; i < arenaHeight; i++) {
    matrix.push([]);
    for (let j = 0; j < arenaWidth; j++) {
      matrix[i].push(0);
    }
  }
  Player1 = new Piece(arenaWidth / 2, 0);
}

function drawMatrix() {
  pieces.forEach(drawPiece);
}

function drawPiece(element) {
  for (let i = element.x; i < element.matrix.length + element.x; i++) {
    for (let j = element.y; j < element.matrix[i - element.x].length + element.y; j++) {
      matrix[i][j] = element.matrix[j - element.y][i - element.x];
    }
  }
}

function checkForCollision(piece, x, y) {
  for (let i = element.x; i < element.matrix.length + element.x; i++) {
    for (let j = element.y; j < element.matrix[i - element.x].length + element.y; j++) {
      if (matrix[i][j] === 0 && element.matrix[j - element.y][i - element.x] !== 0) {
        return true;
      } else {
        return false;
      }
    }
  }
}

function movePiece(piece, x) {
  if (!checkForCollision(piece, piece.x + x, piece.y)) {
    piece.x += x;
  }
}

function rotatePiece(piece) {
  let n = piece.length;
  let pp = [];
  for (let i = 0; i < n; i++) {
    pp.push([]);
    for (let j = 0; j < n; j++) {
      pp[i].push(piece[n - j - 1][i]);
    }
  }
  return piece;
}
// Removes the piece and instead applies it to the background
function applyToMatrix(piece) {
  for (let i = 0; i < piece.length; i++) {
    for (let j = 0; j < piece[i].length; j++) {
      piece.matrix[i][j];
    }
  }
  Player1 = new Piece()
}

function tickPieces() {
  let inc = 1;
  if (checkForCollision(piece, piece.x, piece.y + inc) {
    applyToMatrix();
  }
  Player1.y += 1;
}

function update() {
  drawMatrix();
  pieces.forEach(movePieces);
  tickPieces();
  io.emit('packet', { matrix: matrix });
}

initialize();
setInterval(update, 100);
