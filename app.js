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
  this.x = x - Math.floor(this.matrix[0].length / 2);
  this.y = y;
};

let score;

let movingUp = false, movingLeft = false, movingDown = false, movingRight = false;

io.on('connection', function (socket) {
  console.log("Client connected with ID:", socket.id);
  socket.emit('initgame', { width: arenaWidth, height: arenaHeight });
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
          MoveDown(Player1, 1);
          break;
        case 'd':
          movePiece(Player1, 1);
          movingRight = input.state;
          break;
        case 'space':
          MoveToBottom(Player1);
          break;
      }
    }
  });
  socket.on('disconnect', function () {
    console.log("Client disconnected with ID:", socket.id);
  });
});

let matrix = [];
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
    [6],
    [6],
    [6],
    [6]
  ];
  piecematrix[6] = [
    [7, 0],
    [7, 7],
    [0, 7]
  ];

function getMatrix() {
  return piecematrix[Math.floor( Math.random() * piecematrix.length )];
}

// Defines the play area
let arenaWidth = 10, arenaHeight = 20;

let Player1, Player2;

// creates an array filled with 0's, whose size is depending on the arenaWidth & arenaHeight variables
function initialize() {
  score = 0;
  matrix = [];
  for (let i = 0; i < arenaWidth; i++) {
    matrix.push([]);
    for (let j = 0; j < arenaHeight; j++) {
      matrix[i].push(0);
    }
  }
  Player1 = new Piece(arenaWidth / 2, 0);
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
  for (let i = 0; i < piece.matrix.length; i++) {
    for (let j = 0; j < piece.matrix[i].length; j++) {
      if (piece.matrix[i][j] !== 0) {
        targetMatrix[i + piece.x][j + piece.y] = piece.matrix[i][j];
      }
    }
  }
  return targetMatrix;
}

// Checks if the piece would obstruct anything if it were to move x, y amount of steps
function checkForCollision(piece, x, y) {
  for (let i = 0; i < piece.matrix.length; i++) {
    for (let j = 0; j < piece.matrix[i].length; j++) {
      if (piece.matrix[i][j] !== 0) {
        if (typeof matrix[i + x] == 'undefined' || typeof matrix[i + x][j + y] == 'undefined') {
          return true;
        }
        else if (matrix[i + x][j + y] !== 0 && piece.matrix[i][j] !== 0) {
          return true;
        }
      }
    }
  }
  return false;
}

function movePiece(piece, x, y) {
  if (!y) y = 0;
  if (!checkForCollision(piece, piece.x + x, piece.y + y)) {
    piece.x += x;
    piece.y += y;
  }
}

// takes in a piece of any size, rotates it 90 degrees clockwise and then returns as an array
function rotatePiece(piece) {
  let n = piece.matrix.length;
  let n2 = piece.matrix[0].length;
  let pp = {};
  pp.matrix = [];
  for (let i = 0; i < n2; i++) {
    pp.matrix.push([]);
    for (let j = 0; j < n; j++) {
      // pp.matrix[i].push(piece.matrix[n - j - 1][i]);
      pp.matrix[i].push(piece.matrix[j][n2 - i - 1]);
    }
  }
  if (!checkForCollision(pp, piece.x, piece.y)) return pp.matrix;
  else return piece.matrix;
}
// Removes the piece and instead applies it to the background
function applyToMatrix(piece) {
  for (let i = 0; i < piece.matrix.length; i++) {
    for (let j = 0; j < piece.matrix[i].length; j++) {
      if (piece.matrix[i][j] !== 0) {
        matrix[i + piece.x][j + piece.y] = piece.matrix[i][j];
      }
    }
  }
  CheckForFullRows();
  Player1 = new Piece(arenaWidth / 2, 0);
  if (checkForCollision(Player1, Player1.x, Player1.y)) initialize();
}

let tickInc = 0;

function MoveDown(piece, y) {
  if (checkForCollision(piece, piece.x, piece.y + y)) {
    applyToMatrix(piece);
  } else {
    piece.y += 1;
  }
}

function MoveToBottom(piece) {
  for (let y = piece.y; y < matrix[0].length; y++) {
    if (checkForCollision(piece, piece.x, y)) {
      piece.y = y - 1;
      applyToMatrix(piece);
      return;
    }
  }
}

function tickPiece(piece) {
  let inc = 1;
  if (tickInc++ > 5) {
    MoveDown(piece, inc);
    tickInc = 0;
  }
}

function CheckForFullRows() {
  for (let i = 0; i < arenaHeight; i++) {
    for (let j = 0; j < arenaWidth; j++) {
      if (matrix[j][i] === 0) break;
      else if (j === arenaWidth - 1) ClearRow(i);
    }
  }
}

function ClearRow(row) {
  let i = arenaWidth;
  while (i-- > 0) {
    matrix[i].splice(row, 1);
    matrix[i].unshift(0);
  }
  score += 100;
}

function update() {
  tickPiece(Player1);
  SendPacket();
}

function SendPacket() {
  let deliver = drawMatrix();
  io.emit('packet', { matrix: deliver, score: score });
}

initialize();
setInterval(update, 50);
