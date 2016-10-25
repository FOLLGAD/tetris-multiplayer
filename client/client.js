/*jshint esversion: 6 */

maincnv = document.getElementById("main");
scndcnv = document.getElementById("scnd");
mainctx = maincnv.getContext("2d");
scndctx = scndcnv.getContext("2d");
maincnv.width = 20*20;
maincnv.height = 40*20;
mainctx.scale(20, 20);

// mainctx.fillStyle = '#000';
// mainctx.fillRect(0, 0, maincnv.width, maincnv.height);

socket = io();

maincnv.addEventListener('keydown', keyDownHandler, false);
maincnv.addEventListener('keyup', keyUpHandler, false);

function keyDownHandler(e) {
  switch(e.code) {
    case 'KeyW':
      socket.emit('key', { inputkey: 'w', state: true });
      break;
    case 'KeyA':
      socket.emit('key', { inputkey: 'a', state: true });
      break;
    case 'KeyS':
      socket.emit('key', { inputkey: 's', state: true });
      break;
    case 'KeyD':
      socket.emit('key', { inputkey: 'd', state: true });
      break;
  }
}
function keyUpHandler(e) {
  switch(e.code) {
    case 'KeyW':
      socket.emit('key', { inputkey: 'w', state: false });
      break;
    case 'KeyA':
      socket.emit('key', { inputkey: 'a', state: false });
      break;
    case 'KeyS':
      socket.emit('key', { inputkey: 's', state: false });
      break;
    case 'KeyD':
      socket.emit('key', { inputkey: 'd', state: false });
      break;
  }
}
let latestPacket;

socket.on('packet', function(packet) {
  drawMatrix(packet.matrix);
  latestPacket = packet;
});

const color = ['#000', 'red', 'green', 'yellow', 'blue'];

function drawMatrix(matrix, offset) {
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
