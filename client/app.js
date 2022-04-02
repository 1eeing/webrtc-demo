var express = require('express');
var http = require('http');
var prettyjson = require('prettyjson');
var app = express();
var path = require('path')

app.use(express.static(path.resolve(__dirname, './')));

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, AppKey, Nonce, CurTime, CheckSum');
  // res.header('Access-Control-Max-Age', 604800);
  res.header('Access-Control-Allow-Credentials', true);
  next();
});

var port = 8100;

var httpServer = http.createServer(app);
httpServer.listen(port, function () {
  console.info('server start at ' + port)
  logAddress(httpServer, 'http');
});

function logAddress(server, type) {
  var address = server.address();
  address = type + '://localhost:' + address.port;
  // console.log('vcloud');
  // console.log(address + '/webdemo/vcloud/room.html?type=edu&roomid=36168');
  log();
}

function log(obj) {
  if (!obj) return
  if (typeof obj === 'string') {
    if (obj.length > 100) {
      return;
    }
    obj = [obj];
  }
  console.log(prettyjson.render(obj));
}
