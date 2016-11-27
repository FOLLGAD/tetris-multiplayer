// jshint esversion: 6
// Includes touch-functions & controls

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

document.addEventListener();
