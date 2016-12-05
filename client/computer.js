// jshint esversion: 6
/* jshint -W030 */

document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);
$('#chat > input')[0].addEventListener('keydown', e => {
  if (e.code == "Enter") {
    SendChatMsg();
    $('#chat > input').blur();
  }
  e.stopPropagation();
}, false);
$('#chat > input')[0].addEventListener('keyup', e => {
  e.stopPropagation();
}, false);
$('#nick')[0].addEventListener('keydown', e => {
  e.stopPropagation();
}, false);

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
    intervalStore[key] = setTimeout(function (key, state) {
      intervalStore[key] = setInterval(function (key, state) {
        socket.emit('key', { inputkey: key, state: state });
      }, delay, key, state);
    }, delay * 2, key, state);
  }
}

function StopLooping(key) {
  clearInterval(intervalStore[key]);
  intervalStore[key] = -1;
}

function keyDownHandler(e) {
  switch(e.code) {
    case 'KeyW':
    case 'ArrowUp':
      StartLooping('w', true, 250);
      break;
    case 'KeyA':
    case 'ArrowLeft':
      StartLooping('a', true);
      break;
    case 'KeyS':
    case 'ArrowDown':
      StartLooping('s', true);
      break;
    case 'KeyD':
    case 'ArrowRight':
      StartLooping('d', true);
      break;
    case 'Space':
      socket.emit('key', { inputkey: 'space', state: true });
      break;
    case 'KeyZ':
      socket.emit('key', { inputkey: 'rotateminus90' });
      break;
    case 'KeyX':
      socket.emit('key', { inputkey: 'rotate90' });
      break;
    case 'Enter':
      $('#chat > input').is(':focus') ? $('#chat > input').blur() : $('#chat > input').focus();
      break;
  }
}
function keyUpHandler(e) {
  switch(e.code) {
    case 'KeyW':
    case 'ArrowUp':
      StopLooping('w', false);
      break;
    case 'KeyA':
    case 'ArrowLeft':
      StopLooping('a', false);
      break;
    case 'KeyS':
    case 'ArrowDown':
      StopLooping('s', false);
      break;
    case 'KeyD':
    case 'ArrowRight':
      StopLooping('d', false);
      break;
    case 'Space':
      StartLooping('space', false);
      break;
    default:
      return;
  }
  e.preventDefault();
}

$('#options-button').on("click", function(){
  $("#options-container").is(":visible") ? $("#options-container").hide() : $("#options-container").show();
  $('input:radio[name=color]').each((index, value) => {
    if (theme == blockset[value.value]) {
      value.checked = true;
    }
  });
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
