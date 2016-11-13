// jshint esversion: 6
let arenaWidth = 10, arenaHeight = 20;
class Tetris {
  constructor(playerid) {
    this.playerid = playerid;
    this.width = arenaWidth;
    this.height = arenaHeight;
    this.matrix = Array(this.width).fill(Array(this.height).fill(0));
    this.score = 0;
  }
  // Draws the piece onto the matrix and returns the outcome
  DrawMatrix() {
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
  Init() {
    
  }
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
