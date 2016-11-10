/*jshint esversion: 6 */

maincnv = document.getElementById("main");
mainctx = maincnv.getContext("2d");
let scale = 20;
maincnv.width = 20 * scale;
maincnv.height = 40 * scale;
mainctx.scale(scale, scale);

// mainctx.fillStyle = '#000';
// mainctx.fillRect(0, 0, maincnv.width, maincnv.height);

socket = io();

maincnv.addEventListener('keydown', keyDownHandler, false);
maincnv.addEventListener('keyup', keyUpHandler, false);

let intervalStore = {};
intervalStore.w = -1;
intervalStore.a = -1;
intervalStore.s = -1;
intervalStore.d = -1;
function StartLooping(key, state, delay) {
  if (!delay) delay = 100;
  if (intervalStore[key] === -1) {
    clearInterval(intervalStore[key]);
    socket.emit('key', { inputkey: key, state: state });
    intervalStore[key] = setInterval(function (key, state) {
      socket.emit('key', { inputkey: key, state: state });
    }, delay, key, state);
  }
}

function StopLooping(key) {
  clearInterval(intervalStore[key]);
  intervalStore[key] = -1;
}

function keyDownHandler(e) {
  switch(e.code) {
    case 'KeyW':
      StartLooping('w', true, 250);
      break;
    case 'KeyA':
      StartLooping('a', true);
      break;
    case 'KeyS':
      StartLooping('s', true);
      break;
    case 'KeyD':
      StartLooping('d', true);
      break;
    default:
      return;
  }
  e.preventDefault();
}
function keyUpHandler(e) {
  e.preventDefault();
  switch(e.code) {
    case 'KeyW':
      StopLooping('w');
      break;
    case 'KeyA':
      StopLooping('a');
      break;
    case 'KeyS':
      StopLooping('s');
      break;
    case 'KeyD':
      StopLooping('d');
      break;
    default:
      return;
  }
  e.preventDefault();
}

socket.on('initgame', function(packet) {
  maincnv.width = packet.width * scale;
  maincnv.height = packet.height * scale;
  mainctx.scale(scale, scale);
});

let latestPacket, score;

socket.on('packet', function(packet) {
  drawMatrix(packet.matrix);
  latestPacket = packet;
  document.getElementById("score").innerHTML = packet.score;
});

const color = ['#000', 'red', 'green', 'yellow', 'lightblue', 'pink', 'white', 'beige'];

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
