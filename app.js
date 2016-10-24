/*jshint esversion: 6 */

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

app.use(express.static(__dirname + '/client/'));
app.get('/', function(req, res, next) {
  res.sendFile(__dirname + '/client/index.html');
});
let port = 8080;
server.listen(port);
console.log("server is listening on port", port);
