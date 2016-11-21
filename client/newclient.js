// jshint esversion: 6
// jshint -W030

let canvases = [], canvasctx = [], mycanvas, myctx, selectedRoom;

// let colors = ['#31c7ef', '#f7d308', '#ad4d9c', '#00ff00', '#ff0000', '#00f', '#ef7921'];
//T, J, L, S, O, I, Z
const bright = ['#000', '#ad4d9c', '#0000ff', '#ef7921', '#00ff00', '#f7d308', '#31c7ef', '#ff0000'];
const autism = ['#FF69B4', 'red', 'green', 'blue', 'orange', 'brown', 'purple', 'cyan']; // in honor of the brave Samuel Söderberg. support the fight against autism
const monochrome = ['#000', '#D1D1D1', '#BABABA', '#A3A3A3', '#7C7C7C', '#5D5D5D', '#FFFFFF', '#464646'];
const monochromeold = ['#000', '#FFF', '#DDD', '#BBB', '#999', '#777', '#555', '#CCC', "#EEE", "#888"];

const colorthemes = { bright, autism, monochrome, monochromeold };
let colors = colorthemes.bright;

$('body').on("click", "#rooms tr.room", function(){
  selectedRoom = $(this).children().first().html();
  $(this).css({backgroundColor: "green"});
  console.log("selectedRoom: "+selectedRoom);
  UpdateJoinButton();
});
$('#options-button').on("click", function(){
  $("#options-container").is(":visible") ? $("#options-container").hide() : $("#options-container").show();
  $('input:radio[name=color]').each(() => {
    if (colors == colorthemes[$(this).value])
      $(this).checked = true;
      console.log($(this).value);
  });
});

$('#options-content > input').click(() => {
  colors = colorthemes[$('input[name=color]:checked').val()];
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
  $('#roomselector-content').html('<table id="rooms"></table><button id="create-room" class="button space">Create</button><button id="join-room" class="button space">Join</button><button id="refresh-room" class="button space">Refresh</button>');
  $('#roomselector-content table').html('<tr><th>Game Name</th><th>Description</th><th>Host</th><th>Mode</th><th>Players</th></tr>');
  UpdateJoinButton();
  roominfo.forEach(element => {
    $('#roomselector-content table').append('<tr class="room"><td>' + element.name + "</td><td>Desc</td><td>Host</td><td>Mode</td><td>" + element.players + ' </td></tr>');
    $('#join-room').click(() => {
      JoinGame(selectedRoom);
    });
  });
  $('#create-room').click(() => {
    JoinGame(-1);
  });
  $('#refresh-room').click(() => {
    RequestRoomInfo();
  });
});

function JoinGame (roomname) {
  socket.emit('joinroom', roomname);
}

function LeaveRoom () {
  socket.emit('requestrooms');
  $('#startgame-container').hide();
  $('#roomselector-content').show();
}

// Create a number of canvases
socket.on('initgame', function (packet) {
  ClearGameState();
  $('#roomselector-container').hide();
  $('#gameover-container').hide();
  let scale = 20;
  packet.players.forEach(player => {
    let realscale, canvasid;
    // sets scale to times two if it is your canvas
    if (player.identity == myidentity) {
      realscale = scale * 2;
      canvasid = '#maincanvas';
    } else {
      realscale = scale;
      canvasid = '#canvases';
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
      mycanvas.width = (packet.width + 5) * realscale;
      mycanvas.height = packet.height * realscale;
      myctx = mycanvas.getContext('2d');
      myctx.scale(realscale, realscale);
    }
  });
  $('#gamecontrols').hide();
  canvases.push(...$('#canvases > div > canvas'));
  canvases.forEach(elem => canvasctx.push(elem.getContext('2d')));
  canvases.forEach(elem => {
    elem.width = (packet.width + 5) * scale;
    elem.height = packet.height * scale;
  });
  canvasctx.forEach(elem => {
    elem.scale(scale, scale);
  });
});
socket.on('gameover', winner => {
  $('#gameover-container').show();
  if (winner === -1)
    $('#gameover-content h1').html("You lost");
  else if (winner === -2)
    $('#gameover-content h1').html("Game over");
  else
    $('#gameover-content h1').html(winner + " wins!");
  $('#gamecontrols').show();
});

function ClearGameState () {
  $('#maincanvas').empty();
  $('#time > p').empty();
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
  else name = 'Unknown Tetro';
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
  if (!!packet.time) {
    let time = (packet.time - Date.now()) / 1000, mins = ((time)/60)|0, secs = ((time%60) | 0);
    if (secs < 10) secs = "0" + secs;
    $('#time > p').text(mins + ':' + secs);
  }
  packet.deliver.forEach(player => {
    if (player.identity === myidentity) {
      DrawMatrix(player.matrix, mycanvas, myctx, player.pieceQueue, player.live);
      $('#maincanvas > div > ul > .playerName').text(player.username);
      $('#maincanvas > div > ul > .playerScore').text(player.score);
    } else {
      DrawMatrix(player.matrix, canvases[cnv], canvasctx[cnv], player.pieceQueue, player.live);
      $('#canvases > div:nth-child(' + (cnv + 1) + ') > ul > .playerName').text(player.username);
      $('#canvases > div:nth-child(' + (cnv + 1) + ') > ul > .playerScore').text(player.score);
      cnv++;
    }
  });
});
const arenaWidth = 10, arenaHeight = 20;

function DrawMatrix(matrix, canvas, context, piecequeue, live = true) {
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
  if (!live) {
    context.fillStyle = "rgba(0, 0, 0, 0.6)";
    context.fillRect(0, 0, arenaWidth + 5, arenaHeight);
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
