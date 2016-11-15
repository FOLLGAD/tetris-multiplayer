// jshint esversion: 6

let canvases = [], canvasctx = [];

const socket = io();

function RequestRoomInfo () {
  socket.emit('requestrooms');
}

socket.on('roominfo', function (roominfo) {
  $('#roomselector').empty();
  $('#roomselector').show();
  roominfo.forEach((element, index) => {
    $('#roomselector').append('<button>' + element.name + ": " + element.players + ' players</button>');
    $('#roomselector > button:last').click(() => {
      $('#roomselector').hide();
      JoinGame(element.name);
    });
  });
  $('#roomselector').append('<button>Create new Room</button>');
  $('#roomselector > button:last').click(() => {
    console.log("newg");
    $('#roomselector').hide();
    JoinGame(-1);
  });
  $('#roomselector').append('<button>Refresh</button>');
  $('#roomselector > button:last').click(() => {
    RequestRoomInfo();
  });
});

function JoinGame (roomname) {
  socket.emit('joinroom', roomname);
  $('#startgame').show();
}

// Create a number of canvases
socket.on('initgame', function (packet) {
  ClearGameState();
  $('#startgame').hide();
  let scale = 20;
  for (let i = 0; i < packet.players; i++) {
      // sets scale to times two if it is your canvas
    let realscale;
    if (i === 0) realscale = scale * 2;
    else realscale = scale;

      // creates a new canvas element with class tetrisCanvas
      // and applies it to the html
    $('#canvases').append('<div></div>');
    $('#canvases > div:last').append('<canvas class="tetrisCanvas"></canvas>');
    $('#canvases > div:last').append('<ul></ul>');
    $('#canvases > div:last > ul').append('<li class="playerName"></li>');
    $('#canvases > div:last > ul').append('<li class="playerScore"></li>');

      // creates one score element for each player

      // arrays for easy later access
    canvases.push(document.getElementsByClassName("tetrisCanvas")[i]);
    canvasctx.push(canvases[i].getContext('2d'));

    canvases[i].width = (packet.width + 5) * realscale;
    canvases[i].height = (packet.height) * realscale;
    canvasctx[i].scale(realscale, realscale);
    $('#gamecontrols').hide();
  }
});
socket.on('gameover', function (winner) {
  $('#startgame').show();
  $('#gamecontrols').show();
});

function ClearGameState () {
  let deprecatedcanvases = document.getElementById("canvases");
  while(deprecatedcanvases.hasChildNodes()) {
    deprecatedcanvases.removeChild(deprecatedcanvases.firstChild);
  }
  let oldscores = document.getElementById('scoreboard');
  while(oldscores.hasChildNodes()) {
    oldscores.removeChild(oldscores.firstChild);
  }
  canvases = [];
  canvasctx = [];
}

let myid;

socket.on('registerrequest', function(id) {
  myid = id.clientid;
  myidentity = id.identity;
  $('#register').show();
});

$("form").submit(function (e) {
  e.preventDefault();
  let name;
  if ($('#register-input').val() !== '')
  name = $('#register-input').val();
  else name = 'Unknown Tetro';
  socket.emit('register', name);
  $('#register').hide();

  socket.emit('requestrooms');
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
  packet.forEach(element => {
    if (element.identity === myidentity) {
      DrawMatrix(element.matrix, canvases[0], canvasctx[0], element.pieceQueue);
      $('#canvases > div:nth-child(1) > ul > .playerName').text(element.username);
      $('#canvases > div:nth-child(1) > ul > .playerScore').text(element.score);
    } else {
      DrawMatrix(element.matrix, canvases[cnv], canvasctx[cnv], element.pieceQueue);
      $('#canvases > div:nth-child(' + (cnv + 1) + ') > ul > .playerName').text(element.username);
      $('#canvases > div:nth-child(' + (cnv + 1) + ') > ul > .playerScore').text(element.score);
      cnv++;
    }
  });
});
const arenaWidth = 10, arenaHeight = 20;

// let colors = ['#31c7ef', '#f7d308', '#ad4d9c', '#00ff00', '#ff0000', '#00f', '#ef7921'];
//T, J, L, S, O, I, Z
const monochromeold = ['#000', '#FFF', '#DDD', '#BBB', '#999', '#777', '#555', '#CCC', "#EEE", "#888"];
const monochrome = ['#000', '#D1D1D1', '#BABABA', '#A3A3A3', '#7C7C7C', '#5D5D5D', '#FFFFFF', '#464646'];
const bright = ['#000', '#ad4d9c', '#0000ff', '#ef7921', '#00ff00', '#f7d308', '#31c7ef', '#ff0000'];
const autism = ['#FF69B4', 'red', 'green', 'blue', 'orange', 'brown', 'purple', 'cyan']

let colors = bright;

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

function SendChatMsg() {
  if ($("#input-chat").val().replace(/\s/g, '').length !== 0) {
    socket.emit("chat-msg", $("#input-chat").val());
  }
  $("#input-chat").val("");
}

socket.on('chat-msg', function (message) {
  $('#chatlist').append("<li>" + message + "</li>");
  $('#chatlist').scrollIntoView(false);
});
