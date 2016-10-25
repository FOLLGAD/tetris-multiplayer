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

let movingUp = false;
let movingLeft = false;
let movingDown = false;
let movingRight = false;

io.on('connection', function (socket) {
  io.on('key', function (input) {
    switch(input.inputkey) {
      case 'w':
        beginRotating(socket.id);
        movingUp = input.state;
        break;
      case 'a':
        move
        movingLeft = input.state;
        break;
      case 's':
        movingDown = input.state;
        break;
      case 'd':
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
let pieces;

let arenaWidth = 20;
let arenaHeight = 40;

function initialize() {
  for (let i = 0; i < arenaHeight; i++) {
    matrix.push([]);
    for (let j = 0; j < arenaWidth; j++) {
      matrix[i].push(0);
    }
  }
  pieces = [];
  pieces.push(new Piece(arenaWidth / 2, 0));
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

function tickPieces(piece) {
  if(movingRight && !movingLeft) {
    if (checkForCollision(piece.matrix, piece.x + 1, piece.y + 1)) {
      piece.x++;
      piece.y++;
    }
  } else if (movingLeft && !movingRight) {
    if (checkForCollision(piece.matrix, piece.x - 1, piece.y - 1)) {
      piece.x--;
      piece.y--;
    }
  }
  if (movingUp) {
    let rotated = rotatePiece(piece.matrix);
    if (checkForCollision(rotated, piece.x, piece.y)) {
      piece.matrix = rotated;
    }
  }
}

function update() {
  drawMatrix();
  pieces.forEach(movePieces);
  tickPieces();
  io.emit('packet', { matrix: matrix });
}

initialize();
setInterval(update, 100);
