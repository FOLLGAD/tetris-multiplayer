// jshint esversion: 6

let canvases, canvasctx;

const socket = io();

// Create a number of canvases

socket.on('initgame', function(packet) {
  let deprecatedcanvases = document.getElementById("canvases");
  while(deprecatedcanvases.hasChildNodes()) {
    deprecatedcanvases.removeChild(deprecatedcanvases.firstChild);
  }
  canvases = [];
  canvasctx = [];
  let scale = 20;
  for (let i = 0; i < packet.players; i++) {
      // sets scale to times two if it is your canvas
    let realscale;
    if (i === 0) realscale = scale * 2;
    else realscale = scale;

      // Creates a new canvas element with class tetrisCanvas
      // and applies it to the html
    let ncnv = document.createElement("canvas");
    ncnv.className = "tetrisCanvas";
    document.getElementById("canvases").appendChild(ncnv);

      // creates one score element for each player
    // let score = document.createElement("p");
    // score.className = "tetrisScore";
    // score.id = i;
    // document.getElementsByTagName("body").appendChild(score);

      // arrays for easy later access
    canvases.push(document.getElementsByClassName("tetrisCanvas")[i]);
    canvasctx.push(canvases[i].getContext('2d'));

    canvases[i].width = (packet.width + 5) * realscale;
    canvases[i].height = (packet.height) * realscale;
    canvasctx[i].scale(realscale, realscale);
  }
});

let myid;

socket.on('registerrequest', function(id) {
  myid = id;
  let name;
  name = prompt("Enter your username", "Guest");
  if (name == 'undefined' || name === null) name = "Guest";
  socket.emit('register', { username: name });
});

socket.on('playerlist', function (playersarray) {
  let deprecatednodes = document.getElementById("clientlist");
  while (deprecatednodes.hasChildNodes()) {
    deprecatednodes.removeChild(deprecatednodes.firstChild);
  }
  // recieves an array with connected playersarray
  // then outputs it in form of a name under each canvas & in a list
  let listElement = document.getElementById('clientlist');
  for (let i = 0; i < playersarray.length; i++) {
    let node = document.createElement('li');
    let textnode = document.createTextNode(playersarray[i].username);
    node.appendChild(textnode);
    listElement.appendChild(node);
  }
});

socket.on('packet', function (packet) {
  let cnv = 1;
  for (let id in packet) {
    if (id === myid) {
      DrawMatrix(packet[id].matrix, canvases[0], canvasctx[0], packet[id].pieceQueue);
    } else {
      DrawMatrix(packet[id].matrix, canvases[cnv], canvasctx[cnv], packet[id].pieceQueue);
      cnv++;
    }
  }
});
let arenaWidth = 10, arenaHeight = 20;

const colors = ['#000', '#FFF', '#DDD', '#BBB', '#999', '#777', '#555', '#CCC'];

function DrawMatrix(matrix, canvas, context, piecequeue) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  matrix.forEach((col, x) => {
    col.forEach((value, y) => {
      context.fillStyle = colors[value];
      context.fillRect(x, y, 1, 1);
    });
  });
  context.fillStyle = "#333";
  context.fillRect(arenaWidth, 0, 5, arenaHeight);
  for (let index = 0; index < piecequeue.length; index++) {
    for (let i = 0; i < piecequeue[index].matrix.length; i++) {
      for (let o = 0; o < piecequeue[index].matrix[i].length; o++) {
        if (piecequeue[index].matrix[i][o] !== 0) {
          context.fillStyle = colors[piecequeue[index].matrix[i][o]];
          context.fillRect(i + arenaWidth + 1, o + index * 4 + 1, 1, 1);
        }
      }
    }
  }
}

function RequestGameStart() {
  socket.emit('startgame');
}
