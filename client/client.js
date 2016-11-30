// jshint esversion: 6
// jshint -W030

let canvases = [], canvasctx = [], mycanvas, myctx, selectedRoom;

// let colors = ['#31c7ef', '#f7d308', '#ad4d9c', '#00ff00', '#ff0000', '#00f', '#ef7921'];
//T, J, L, S, O, I, Z
const bright = ['#000', '#ad4d9c', '#0000ff', '#ef7921', '#00ff00', '#f7d308', '#31c7ef', '#ff0000', 'beige'];
const autism = ['#FF69B4', 'red', 'green', 'blue', 'orange', 'brown', 'purple', 'cyan', 'beige'];
const monochrome = ['#000', '#D1D1D1', '#BABABA', '#A3A3A3', '#7C7C7C', '#5D5D5D', '#FFFFFF', '#464646', 'beige'];
const monochromeold = ['#000', '#FFF', '#DDD', '#BBB', '#999', '#777', '#555', '#CCC', 'beige'];

const colorthemes = { bright, autism, monochrome, monochromeold };
let colors = colorthemes.bright;

const blockset = {};

['default', 'monochrome'].forEach(setname => {
  blockset[setname] = [];
  for (let i = 0; i < 9; i++) {
    blockset[setname][i] = new Image();
    blockset[setname][i].src = '/skins/' + setname + '/' + i + '.png';
  }
});

let theme = blockset.default;



$('#options-content > input').click(() => {
  theme = blockset[$('input[name=color]:checked').val()];
});

const socket = io();

function RequestRoomInfo () {
  socket.emit('requestrooms');
}
function UpdateJoinButton(){
  if (selectedRoom === null) {
    $("#join-room").attr('disabled','disabled');
  }else{
    $("#join-room").removeAttr('disabled');
  }
}
socket.on('roominfo', function (roominfo) {
  $('#roomselector-container').show();
  $('#roomselector-content').html('<table id="rooms"></table><button id="create-room" class="button space">Create</button><button id="join-room" class="button space">Join</button><button id="refresh-room" class="button space">Refresh</button>');
  $('#roomselector-content table').html('<tr><th>Game Name</th><th>Description</th><th>Host</th><th>Mode</th><th>Players</th></tr>');
  UpdateJoinButton();
  if(roominfo.length < 1){
      $('#roomselector-content table').html('<h1 class="center">There are no rooms!</h1>');
  }else{
      roominfo.forEach(element => {
      $('#roomselector-content table').append('<tr class="room"><td>' + element.name + "</td><td>Desc</td><td>Host</td><td>Mode</td><td>" + element.players + ' </td></tr>');
      $('#join-room').click(() => {
        JoinGame(selectedRoom);
      });
    });
  }

  $('#create-room').click(() => {
    JoinGame(-1);
  });
  $('#refresh-room').click(() => {
    RequestRoomInfo();
  });
});

function JoinGame (roomname) {
  $('#clientcontainer').show();
  $('#startgame-container').show();

  socket.emit('joinroom', roomname);
}

function LeaveRoom () {
  socket.emit('requestrooms');
  $('#startgame-container').hide();
  $('#clientcontainer').hide();
  $('#roomselector-content').show();
}

let canvassize = 16, scale = 1;

// Create a number of canvases
socket.on('initgame', function (packet) {
  ClearGameState();
  $('#roomselector-container').hide();
  $('#gameover-content').hide();
  $('#startgame-container').hide();
  packet.players.forEach(player => {
    let mycanvassize, myscale, canvasid;
    // sets scale to times two if it is your canvas
    if (player.identity == myidentity) {
      mycanvassize = canvassize * 2;
      myscale = scale * 2;
      canvasid = '#maincanvas';
    } else {
      canvasid = '#canvases';
      mycanvassize = canvassize;
      myscale = scale;
    }
    // creates a new canvas element with class tetrisCanvas
    $(canvasid).append('<div class="other-player"></div>');
    $(canvasid + ' > div:last').append('<canvas class="tetrisCanvas"></canvas>');
    $(canvasid + ' > div:last').append('<ul></ul>');
    $(canvasid + ' > div:last > ul').append('<li class="playerName"></li>');
    $(canvasid + ' > div:last > ul').append('<li class="playerScore"></li>');
    // arrays for easy later access
    if (player.identity == myidentity) {
      mycanvas = $('#maincanvas > div > canvas')[0];
      mycanvas.width = (packet.width + 5) * mycanvassize;
      mycanvas.height = packet.height * mycanvassize;
      myctx = mycanvas.getContext('2d');
      myctx.scale(myscale, myscale);
      myctx.imageSmoothingEnabled = false;
    }
  });
  $('#gamecontrols').hide();
  canvases.push(...$('#canvases > div > canvas'));
  canvases.forEach(elem => canvasctx.push(elem.getContext('2d')));
  canvases.forEach(elem => {
    elem.width = (packet.width + 5) * canvassize;
    elem.height = packet.height * canvassize;
  });
  canvasctx.forEach(elem => {
    elem.scale(scale, scale);
    elem.imageSmoothingEnabled = false;
  });
});
socket.on('gameover', results => {
  let gameovermsg, i = 1;
  $('#gameover-content').show();
  $('#startgame-container').show();
  if (typeof results[0] != 'undefined' && typeof results[1] != 'undefined' && results[0].score == results[1].score)
    gameovermsg = "There was a tie!";
  else
    gameovermsg = '<span style="color:green">'+results[0].username + "</span> won the game!";
  $('#gameover-content p').html('<h4>'+ gameovermsg +'</h4><table><tr><th>Placement</th><th>Name</th><th>Score</th></tr>');
  results.forEach(element => {
    $('#gameover-content table').append('<tr class="room"><td>' + i++ + "</td><td>"+ element.username +  "</td><td>" + element.score + ' </td></tr>');
  });
  $('#gameover-content p').append('</table>');
  $('#gamecontrols').show();
});

let myid;

socket.on('registerrequest', id => {
  ClearGameState();
  myid = id.clientid;
  myidentity = id.identity;
  $('#menu-container').show();
});

$("form").submit(e => {
  e.preventDefault();
  let name;
  if ($('#register-input').val() !== '')
    name = $('#register-input').val();
  else
    name = 'Unknown Tetro';
  socket.emit('register', name);
  $('#menu-container').hide();
  socket.emit('requestrooms');
});

socket.on('playerlist', playersarray => {
  $('#roomselector-content').hide();
  $('#clientlist').empty();
  for (let i = 0; i < playersarray.length; i++) {
    $('#clientlist').append('<li>'+ playersarray[i].username +'</li>');
  }
  $('#inroom-controls').show();
  $('#startgame-container').show();
});

socket.on('packet', packet => {
  let cnv = 0;
  if (typeof packet.timeleft != 'undefined') {
    let time = packet.timeleft / 1000,
        mins = ((time) / 60) | 0,
        secs = ((time % 60) | 0);
    secs = secs < 10 ? '0' + secs : secs;
    $('#time > p').text(mins + ':' + secs);
  }
  packet.deliver.forEach(player => {
    if (player.identity === myidentity) {
      DrawMatrix(player.matrix, mycanvas, myctx, player.pieceQueue, player.activePiece, player.live);
      $('#maincanvas > div > ul > .playerName').text(player.username);
      $('#maincanvas > div > ul > .playerScore').text(player.score);
    } else {
      DrawMatrix(player.matrix, canvases[cnv], canvasctx[cnv], player.pieceQueue, player.activePiece, player.live);
      $('#canvases > div:nth-child(' + (cnv + 1) + ') > ul > .playerName').text(player.username);
      $('#canvases > div:nth-child(' + (cnv + 1) + ') > ul > .playerScore').text(player.score);
      cnv++;
    }
  });
});

function DrawPiece(piece, matrix) {
  if (piece !== null) {
    let ghost = ShadeDrop(piece, matrix);
    for (let i = 0; i < ghost.matrix.length; i++) {
      for (let j = 0; j < ghost.matrix[i].length; j++) {
        if (ghost.matrix[i][j] !== 0) {
          matrix[i + ghost.x][j + ghost.y] = 8;
        }
      }
    }
    for (let i = 0; i < piece.matrix.length; i++) {
      for (let j = 0; j < piece.matrix[i].length; j++) {
        if (piece.matrix[i][j] !== 0) {
          matrix[i + piece.x][j + piece.y] = piece.matrix[i][j];
        }
      }
    }
  }
  return matrix;
}

// Takes a piece, and returns at what y-coordinate it would drop
function ShadeDrop (piece, matrix) {
  ghost = Object.assign({}, piece);
  let i = 0;
  while (!CheckCollision(ghost, matrix)) {
    ghost.y++;
  }
  ghost.y -= 1;
  return ghost;
}

function CheckCollision (piece, matrix) {
  for (let i = 0; i < piece.matrix.length; i++) {
    for (let j = 0; j < piece.matrix[i].length; j++) {
      if (piece.matrix[i][j] !== 0) {
        if (typeof matrix[i + piece.x] == 'undefined' || typeof matrix[i + piece.x][j + piece.y] == 'undefined') {
          return true;
        }
        else if (matrix[i + piece.x][j + piece.y] !== 0 && piece.matrix[i][j] !== 0) {
          return true;
        }
      }
    }
  }
  return false;
}

const arenaWidth = 10, arenaHeight = 20;

function DrawMatrix(matrix, canvas, context, piecequeue, piece, live = true) {
  if (piece != 'undefined') {
    matrix = DrawPiece(piece, matrix);
  }
  context.clearRect(0, 0, canvas.width, canvas.height);
  matrix.forEach((col, x) => {
    col.forEach((value, y) => {
      // context.fillStyle = colors[value];
      // context.fillRect(x * canvassize, y * canvassize, canvassize, canvassize);
      context.drawImage(theme[value], x * canvassize, y * canvassize);
    });
  });
  context.fillStyle = "#333";
  context.fillRect(arenaWidth * canvassize, 0, 5 * canvassize, arenaHeight * canvassize);
  for (let index = 0; index < piecequeue.length; index++) {
    for (let i = 0; i < piecequeue[index].matrix.length; i++) {
      for (let o = 0; o < piecequeue[index].matrix[i].length; o++) {
        if (piecequeue[index].matrix[i][o] !== 0) {
          // context.fillStyle = colors[piecequeue[index].matrix[i][o]];
          // context.fillRect((i + arenaWidth + 1) * canvassize, (o + index * 4 + 1) * canvassize, canvassize, canvassize);
          context.drawImage(theme[piecequeue[index].matrix[i][o]], (i + arenaWidth + 1) * canvassize, (o + index * 4 + 1) * canvassize);
        }
      }
    }
  }
  if (!live) {
    context.fillStyle = "rgba(0, 0, 0, 0.6)";
    context.fillRect(0, 0, canvas.width, canvas.height);
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

socket.on('chat-msg', function (packet) {
  $('#chatlist').append("<li>" + packet.username + ": " + packet.message + "</li>");
  $('#chatlist').scrollTop($('#chatlist').prop("scrollHeight"));
});

const Disp=(o="")=>{[3,8,5,7,10,0,4,7,1,9,2,6].forEach(a=>o+='abcehiklmä '[a]);return o+" "+(63<<5);};

console.log('%c Welcome to \n__/\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\___/\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\___/\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_____/\\\\\\\\\\\\\\\\\\_______/\\\\\\\\\\\\\\\\\\\\\\______/\\\\\\\\\\\\\\\\\\\\\\___\n _\\///////\\\\\\/////___\\/\\\\\\///////////___\\///////\\\\\\/////____/\\\\\\///////\\\\\\____\\/////\\\\\\///_____/\\\\\\/////////\\\\\\_\n  _______\\/\\\\\\________\\/\\\\\\____________________\\/\\\\\\________\\/\\\\\\_____\\/\\\\\\________\\/\\\\\\_______\\//\\\\\\______\\///__\n   _______\\/\\\\\\________\\/\\\\\\\\\\\\\\\\\\\\\\____________\\/\\\\\\________\\/\\\\\\\\\\\\\\\\\\\\\\/_________\\/\\\\\\________\\////\\\\\\_________\n    _______\\/\\\\\\________\\/\\\\\\///////_____________\\/\\\\\\________\\/\\\\\\//////\\\\\\_________\\/\\\\\\___________\\////\\\\\\______\n     _______\\/\\\\\\________\\/\\\\\\____________________\\/\\\\\\________\\/\\\\\\____\\//\\\\\\________\\/\\\\\\______________\\////\\\\\\___\n      _______\\/\\\\\\________\\/\\\\\\____________________\\/\\\\\\________\\/\\\\\\_____\\//\\\\\\_______\\/\\\\\\_______/\\\\\\______\\//\\\\\\__\n       _______\\/\\\\\\________\\/\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\________\\/\\\\\\________\\/\\\\\\______\\//\\\\\\___/\\\\\\\\\\\\\\\\\\\\\\__\\///\\\\\\\\\\\\\\\\\\\\\\/___\n        _______\\///_________\\///////////////_________\\///_________\\///________\\///___\\///////////_____\\///////////_____', 'color: grey');
