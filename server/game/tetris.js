module.exports = class Tetris {
	constructor(arenaWidth = 10, arenaHeight = 20) {
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