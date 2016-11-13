/*jshint esversion: 6 */

maincnv = document.getElementById("main");
mainctx = maincnv.getContext("2d");
let scale = 40;
maincnv.width = 20 * scale;
maincnv.height = 40 * scale;
mainctx.scale(scale, scale);

socket = io();

let myid;
let cnvctx = [];

socket.on('initgame', function(packet) {
  myid = packet.id;
  maincnv.width = packet.width * scale;
  maincnv.height = packet.height * scale;
  mainctx.scale(scale, scale);
  for (let i = 1; i < packet.players; i++) {
    let ncnv = document.createElement("canvas");
    document.getElementById("canvases").appendChild(ncnv);
    mainctx.scale(scale, scale);
  }
});

let latestPacket;

socket.on('packet', function(packet) {
  drawMatrix(packet.matrix);
  latestPacket = packet;
  document.getElementById("score").innerHTML = packet.score;
});

socket.on('registerrequest', function() {
  let name;
  while (!name) {
    name = prompt("Enter your username", "Guest");
  }
  socket.emit('register', { username: name });
});

const color = ['#000', 'red', 'green', 'yellow', 'blue', 'violet', 'orange', 'purple'];

function drawMatrix(matrix) {
  mainctx.clearRect(0, 0, maincnv.width, maincnv.height);
  matrix.forEach((col, x) => {
    col.forEach((value, y) => {
      if (value !== 0) {
        mainctx.fillStyle = color[value];
        mainctx.fillRect(x, y, 1, 1);
      }
    });
  });
}

function sendPacket() {

}
