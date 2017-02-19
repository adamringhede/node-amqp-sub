const Server = require('./server');
const amqp = require('amqplib/callback_api');
const http = require('http')

const validRouteKey = /[\w\_\-\/\\#\*]+(\.[\w\_\-\/\\#\*]*)*/i

module.exports = 
class Subscriber {
  constructor({handler, path = '', exchange = 'default', port = 8001, httpServer = createHttpServer(port)}) {
    var server = new Server(httpServer);
    server.on('request', this.handleRequest(exchange, path, handler))
    
    const amqpUri = process.env.AMQP_URL || 'amqp://localhost'
    this.mqReady = createAmqpConnection(amqpUri, exchange)
  }

  handleRequest(exchange, pathSpec, handler) {
    const parseParams = createParamsParser(pathSpec) 
    return (request, accept) => {
      var params = parseParams(request.resourceURL.pathname)
      if (params == null && validatePath(pathSpec)) {
        console.log(`Error: Request path did not match: ${request.resourceURL.href} does not match ${pathSpec}`)
        return request.reject(`Path did not match ${pathSpec}`)
      }
      var query = request.resourceURL.query
      
      const req = {params, query}
      const result = handler(req);
      const gotResult = result instanceof Promise
        ? result
        : Promise.resolve(result);
        
      gotResult.then(routeKey => {
        if (routeKey != null && typeof routeKey == 'string') {
          console.log("Accepted subscription")
          var connection = accept();
          this.subscribe(routeKey, exchange, connection);
        } else {
          console.log(`Rejected subscribe request: ${request.resourceURL.href}`)
          return request.reject("Invalid request");
        }
      }) 
    }
  }

  subscribe(routeKey, exchange, wsConnection) {
    if (!validRouteKey.test(routeKey)) {
      throw new Error(`Invalid route key: "${routeKey}"`)
    }

    var options = {
      durable: false,
      exclusive: true,
      autoDelete: true
    };
    
    this.mqReady.then(function({channel, amqpConnection}) {
      channel.assertQueue('', options, function(err, q) {
        channel.bindQueue(q.queue, exchange, routeKey);
        channel.consume(q.queue, function(msg) {
          wsConnection.sendUTF(msg.content.toString());
        }, {noAck: true});
      });
    }).catch(function (err) {
      console.log(err);
    });
  }
}

function validatePath(path) {
  return path != null && typeof path == 'string' && parsePath(path).length > 0
}

function parsePath(str) {
  return str.replace(/^\//, '').replace(/\/$/, '').split('/')
}

function createParamsParser(spec) {
  const specParts = parsePath(spec || '');
  return (path) => {
    const params = {}
    const pathParts = parsePath(path);
    if (pathParts.length != specParts.length) {
      return null
    } 
    for (let i = 0; i < pathParts.length; i++) {
      if (specParts[i] != null && pathParts[i] != null) {
        if (specParts[i].startsWith(':')) {
          params[specParts[i].slice(1)] = pathParts[i]
        }
      } else {
        return null
      }
    }
    return params
  }
}

function createAmqpConnection(amqpUri, ex) {
  return new Promise(function (resolve, reject) {
    amqp.connect(amqpUri, function(err, conn) {
      if (err) return reject(err);
      conn.createChannel(function(err, ch) {
        if (err) return reject(err);
        ch.assertExchange(ex, 'topic', {durable: false});
        resolve({channel: ch, amqpConnection: conn});
      });
    });
  })
}


function createHttpServer(port = 8001) {
  var server = http.createServer();
  server.listen(port, function() {
    console.log('Server is listening on port ' + port);
  });
  return server;
}