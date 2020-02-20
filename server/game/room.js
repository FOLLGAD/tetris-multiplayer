const Player = require('./player')

module.exports = class Room {
	constructor(io) {
		this.tetris = {};
		this.players = [];
		this.active = false;
		this.name = ((Math.random() * 100000) | 0).toString();
		this.winlist = [];
		this.type = 'single';
		this.droprate = 1000;
		this.gameLength = 2 * 60 * 1000; // 2 minutes
		this.seed = null;
		this.io = io
		// timed mode game length in ms
	}
	Start(Players) {
		if (this.players.length === 0 || this.active) return false;
		if (this.players.length === 1) this.type = 'single';
		else this.type = 'timed';
		this.active = true;

		// generates a seed that is used to generate the same pieces for all users
		this.seed = Math.floor(Math.random() * 100000);

		this.tetris = {};
		for (let i = 0; i < this.players.length; i++) {
			this.tetris[this.players[i].id] = new Player(this.seed, this.players[i].username);
		}
		let deliver = [];
		for (let id in this.tetris) {
			const i = deliver.push({}) - 1;
			deliver[i].score = this.tetris[id].score;
			deliver[i].username = Players[id].username;
			deliver[i].identity = Players[id].identity;
		}
		this.io.to(this.name).emit('initgame', { width: 10, height: 20, players: deliver });
		this.startingTime = Date.now();
		if (this.type == "timed")
			this.endingTime = Date.now() + this.gameLength;
	}
	CheckWinner(Players) {
		let winner, scores = [];
		for (let id in this.tetris) {
			if (!this.tetris[id].live) continue;
			scores.push({ id, score: this.tetris[id].score });
		}
		scores.sort((a, b) => {
			return b.score - a.score;
		});
		if (!!scores[1] && scores[0].score !== scores[1].score)
			winner = Players[scores[0].id].username;
		else if (!!scores[0] && scores.length === 1)
			winner = Players[scores[0].id].username;
		this.Stop(winner);
	}
	ScoreList() {
		let scores = [];
		for (let id in this.tetris) {
			scores.push({ username: this.tetris[id].username, score: this.tetris[id].score });
		}
		scores.sort((a, b) => {
			return b.score - a.score;
		});
		return scores;
	}
	Update(Players) {
		if (this.type == 'timed' && Date.now() > this.endingTime) {
			this.CheckWinner();
			return;
		}
		let dt = Date.now() - this.startingTime;
		let level = (dt / 20000) | 0;
		let speed = ((1 + 0.1 * level) * 100) | 0;
		let livecount = [];
		for (let id in this.tetris) {
			if (this.tetris[id].live) {
				this.tetris[id].TickPiece(speed);
				livecount.push(id);
			}
		}
		if (livecount.length === 1 && this.type != 'single') this.Stop(Players[livecount[0]].username);
		else if (livecount.length === 0) this.Stop();
		this.SendPackets(Players);
	}
	Stop() {
		let results = this.ScoreList();
		this.active = false;
		this.io.to(this.name).emit('gameover', results);
		this.startingTime = 0;
	}
	SendPackets(Players) {
		let timeleft = this.endingTime - Date.now(), deliver = [];
		for (let id in this.tetris) {
			const i = deliver.push({}) - 1;
			deliver[i].matrix = this.tetris[id].DrawMatrix();
			deliver[i].activePiece = this.tetris[id].piece;
			deliver[i].pieceQueue = this.tetris[id].pieceQueue;
			deliver[i].score = this.tetris[id].score;
			deliver[i].live = this.tetris[id].live;
			if (id in Players) {
				deliver[i].username = Players[id].username;
				deliver[i].identity = Players[id].identity;
			}
		}
		if (this.type == 'timed')
			this.io.to(this.name).emit('packet', { deliver, timeleft });
		else
			this.io.to(this.name).emit('packet', { deliver });
	}
}