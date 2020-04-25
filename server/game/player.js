const Piece = require('./piece')
const Tetris = require('./tetris')


module.exports = class Player {
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
		this.piecesPlaced = 0;
		this.username = username;
		this.NewPiece();
	}
	NewPiece() {
		while (this.pieceQueue.length < 6) {
			this.bag = [];
			while (this.bag.length < 7) {
				this.pieceNumber = this.getPieceNumber();
				if (!this.bag.includes(this.pieceNumber)) {
					this.bag.push(this.pieceNumber);
				}
			}
			for (let i = 0; i < this.bag.length; i++) {
				this.pieceQueue.push(new Piece(this.tetris.width / 2, this.bag[i]));
			}
		}
		this.piece = this.pieceQueue.splice(0, 1)[0];
	}
	// // takes a piece and outputs it on the matrix
	// DrawPiece(targetMatrix) {
	// 	if (this.piece !== null) {
	// 		for (let i = 0; i < this.piece.matrix.length; i++) {
	// 			for (let j = 0; j < this.piece.matrix[i].length; j++) {
	// 				if (this.piece.matrix[i][j] !== 0) {
	// 					targetMatrix[i + this.piece.x][j + this.piece.y] = this.piece.matrix[i][j];
	// 				}
	// 			}
	// 		}
	// 	}
	// 	return targetMatrix;
	// }
	// Draws the piece onto the matrix and returns the outcome
	DrawMatrix() {
		let toDeliver = [];
		let i = this.matrix.length;
		while (i--) {
			toDeliver[i] = [];
			let o = this.matrix[i].length;
			while (o--) {
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
		for (let i = 0; i < this.piece.matrix.length; i++) {
			for (let j = 0; j < this.piece.matrix[i].length; j++) {
				if (this.piece.matrix[i][j] !== 0) {
					this.matrix[i + this.piece.x][j + this.piece.y] = this.piece.matrix[i][j];
				}
			}
		}
		this.CheckForFullRows();
		this.NewPiece();
		this.piecesPlaced++
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

		if (rowscleared === 1 || rowscleared === 2 || rowscleared === 3 || rowscleared === 4) {
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