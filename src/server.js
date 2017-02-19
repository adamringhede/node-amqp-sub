const WebSocketServer = require('websocket').server;
const http = require('http');
const EventEmitter = require('events');


module.exports = 
class Server extends EventEmitter {

  constructor(httpServer, protocol = null) {
    super();
    var self = this;
    this.connections = 0;

    var wsServer = new WebSocketServer({
      httpServer,
      autoAcceptConnections: false
    });
     
    function originIsAllowed(origin) {
      return true;
    }
     
    wsServer.on('request', function(request) {

      if (!originIsAllowed(request.origin)) {
        request.reject("Origin not allowed");
        return;
      }
      
      var connection = null;
      self.connections++;

      try {
        self.emit('request', request, () => {
          connection = request.accept(protocol, request.origin);
          connection.on('close', function(reasonCode, description) {
            self.connections--;
            console.log('Subscriber ' + connection.remoteAddress + ' disconnected.');
          });
          return connection;
        });
      } catch (e) {
        console.log(e);
      }


    });
  } 
}

