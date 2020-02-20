const tetrominos = require('./tetrominos')

module.exports = class Piece {
	constructor(x, n) {
		this.matrix = tetrominos[n];
		console.log("this.matrix piece.js", this.matrix)
		this.x = x - Math.floor(this.matrix[0].length / 2);
		this.y = 0;
	}
}