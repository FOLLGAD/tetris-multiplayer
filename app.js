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

let movingUp = false;
let movingLeft = false;
let movingDown = false;
let movingRight = false;

io.on('connection', function (socket) {
  io.on('key', function (input) {
    switch(input.inputkey) {
      case 'w':
        movingUp = input.state;
        break;
      case 'a':
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

let Piece = function (x, y) {
  this.x = x;
  this.y = y;
  this.matrix = getMatrix();
};

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
  pieces.push(new Piece(arenaWidth / 2 + 1, 0));
}

function drawMatrix() {
  pieces.forEach(drawPiece);
}

function drawPiece(element) {
  for (let i = element.y; i < element.matrix.length + element.y; i++) {
    for (let j = element.x; j < element.matrix[i - element.y].length + element.x; j++) {
      matrix[i][j] = element.matrix[j - element.x][i - element.y];
    }
  }
}

function update() {
  drawMatrix();
  io.emit('packet', { matrix: matrix });
}

initialize();
setInterval(update, 100);
