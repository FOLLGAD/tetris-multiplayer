// jshint esversion: 6
// jshint -W030

let canvases = [],
    canvasctx = [],
    lastpacket,
    mycanvas,
    myctx,
    animationid;

const blockset = {};

['default', 'monochrome', 'autism'].forEach(setname => {
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
socket.on('roominfo', function (roominfo) {
  SwitchView(["roombrowser"]);
  $('#roombrowser-page table').html(`
      <tr>
        <th>Game Name</th>
        <th>Host</th>
        <th>Mode</th>
        <th>Players</th>
        <th></th>
      </tr>
    `);
  if(roominfo.length < 1){
      $('#roombrowser-page table').html('<h1 class="center">There are no rooms!</h1>');
      $("#join-room").addClass('disabled');
  } else {
      roominfo.forEach(element => {
      $('#roombrowser-page table').append(`
          <tr class="room">
            <td>${element.name}</td>
            <td>Host</td>
            <td>Mode</td>
            <td>${element.players}</td>
            <td><button class="button joinbtn" name=${element.name}>Join</button></td>
          </tr>
        `);
    });
  }
  $('#roombrowser-page > table > tr > td > button.joinbtn').click(function() {
    JoinRoom($(this).attr('name'));
  });
  $('#create-room').click(() => {
    JoinRoom(-1);
  });
  $('#refresh-room').click(() => {
    RequestRoomInfo();
  });
});

function JoinRoom (roomname) {
  SwitchView(['room']);
  socket.emit('joinroom', roomname);
}

function LeaveRoom () {
  socket.emit('requestrooms');
  SwitchView(['roombrowser']);
}

let canvassize = 16, scale = 1;

// Create a number of canvases
socket.on('initgame', function (packet) {
  ingame = true;
  ClearGameState();
  SwitchView(['ingame']);
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
  animationid = requestAnimationFrame(DrawAll);
});
socket.on('gameover', results => {
  console.log("gameover");
  ingame = false;
  cancelAnimationFrame(animationid);
  let gameovermsg, i = 1;
  SwitchView(['room']);
  if (typeof results[0] != 'undefined' && typeof results[1] != 'undefined' && results[0].score == results[1].score)
    gameovermsg = "There was a tie!";
  else
    gameovermsg = '<span style="color:green">'+results[0].username + "</span> won the game!";
  $('#scoreboard').html('<h1>'+ gameovermsg +'</h1><table><tr><th>Placement</th><th>Name</th><th>Score</th></tr>');
  results.forEach(element => {
    $('#scoreboard table').append('<tr class="room"><td>' + i++ + "</td><td>"+ element.username +  "</td><td>" + element.score + ' </td></tr>');
  });
  $('#scoreboard').append('</table>');
});

let myid;

socket.on('registerrequest', id => {
  ClearGameState();
  myid = id.clientId;
  myidentity = id.identity;
  SwitchView(['start']);
});

$("form#nick").submit(e => {
  e.preventDefault();
  let name;
  if ($('#nick > input[type="text"]').val() !== '')
    name = $('#nick > input[type="text"]').val();
  else
    name = 'Unknown Tetro';
  if (name.length > 20) return;
  socket.emit('register', name);
  socket.emit('requestrooms');
  SwitchView(['roombrowser']);
});

socket.on('playerlist', playersarray => {
  $("#playerlist").html("<h1>Players</h1><table><tr><th>Name</th><th>Wins</th><th>Team</th></tr></table>");
  for (let i = 0; i < playersarray.length; i++) {
    $('#playerlist table').append('<tr class="room"><td>'+playersarray[i].username+'</td><td>WINS</td><td>TEAM</td></tr>');
  }
});

let shouldskip, packet, ingame = false;

socket.on('packet', packet => {
  lastpacket = packet;
  shouldskip = false;
});

function DrawAll() {
  if (shouldskip || !lastpacket) {
    console.log("skipped");
    animationid = requestAnimationFrame(DrawAll);
    return;
  }
  let packet = Object.assign({}, lastpacket);
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
      $('#maincanvas > div > ul > .playerScore').text('Score: ' + player.score);
    } else {
      DrawMatrix(player.matrix, canvases[cnv], canvasctx[cnv], player.pieceQueue, player.activePiece, player.live);
      $('#canvases > div:nth-child(' + (cnv + 1) + ') > ul > .playerName').text(player.username);
      $('#canvases > div:nth-child(' + (cnv + 1) + ') > ul > .playerScore').text(player.score);
      cnv++;
    }
    shouldskip = true;
  });
  animationid = requestAnimationFrame(DrawAll);
}

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
  if ($("#chat > input").val().replace(/\s/g, '').length !== 0) {
    socket.emit("chat-msg", $("#chat > input").val());
  }
  $("#chat > input").val("");
}

socket.on('chat-msg', function (packet) {
  $('#chat > ul').append('<li><span class="sender">' + packet.username + '</span>: ' + packet.message + '</li>');
  $('#chat > ul').scrollTop($('#chat > ul').prop("scrollHeight"));
});

function SwitchView(visible, hideCurrent) {
  if (typeof(hideCurrent) === undefined){
    hideCurrent = false;
  }
  if (!hideCurrent){
    $(".page").addClass("hidden");
    if (visible.constructor !== Array) return;
    visible.forEach(elem => {
      $("#" + elem + "-page").removeClass("hidden");
      if ($('#' + elem + '-page').length < 1) console.warn(elem + 'does not exist');
    });
  }else{
    $("#" + elem + "-page").addClass("hidden");
  }
}

const Disp=(o="")=>{[3,8,5,7,10,0,4,7,1,9,2,6].forEach(a=>o+='abcehiklmä '[a]);return o+" "+(63<<5);};

console.log('%c Welcome to \n__/\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\___/\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\___/\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_____/\\\\\\\\\\\\\\\\\\_______/\\\\\\\\\\\\\\\\\\\\\\______/\\\\\\\\\\\\\\\\\\\\\\___\n _\\///////\\\\\\/////___\\/\\\\\\///////////___\\///////\\\\\\/////____/\\\\\\///////\\\\\\____\\/////\\\\\\///_____/\\\\\\/////////\\\\\\_\n  _______\\/\\\\\\________\\/\\\\\\____________________\\/\\\\\\________\\/\\\\\\_____\\/\\\\\\________\\/\\\\\\_______\\//\\\\\\______\\///__\n   _______\\/\\\\\\________\\/\\\\\\\\\\\\\\\\\\\\\\____________\\/\\\\\\________\\/\\\\\\\\\\\\\\\\\\\\\\/_________\\/\\\\\\________\\////\\\\\\_________\n    _______\\/\\\\\\________\\/\\\\\\///////_____________\\/\\\\\\________\\/\\\\\\//////\\\\\\_________\\/\\\\\\___________\\////\\\\\\______\n     _______\\/\\\\\\________\\/\\\\\\____________________\\/\\\\\\________\\/\\\\\\____\\//\\\\\\________\\/\\\\\\______________\\////\\\\\\___\n      _______\\/\\\\\\________\\/\\\\\\____________________\\/\\\\\\________\\/\\\\\\_____\\//\\\\\\_______\\/\\\\\\_______/\\\\\\______\\//\\\\\\__\n       _______\\/\\\\\\________\\/\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\________\\/\\\\\\________\\/\\\\\\______\\//\\\\\\___/\\\\\\\\\\\\\\\\\\\\\\__\\///\\\\\\\\\\\\\\\\\\\\\\/___\n        _______\\///_________\\///////////////_________\\///_________\\///________\\///___\\///////////_____\\///////////_____', 'color: grey');
