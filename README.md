This is a layer between WebSockets and message queue using AMQP. It makes it possible to easily build fault tolerant, scalable, and reliable notification systems with a layer of security. 


## How to use it

### Example usage
```js
const sub = require('@adamringhede/amqp-sub')

sub.start({
  handler: req => `my.routes.*`,
  path: '/subscribe',
  amqpUri: 'amqp://localhost',
  exchange: 'updates',
  port: 8001
})
```

### Parameters 

* **`handler`**: `req -> Promise<String>|String` A function which is called when a new connection is established. It should perfrom any necessary authorization logic and return or resolve a route key as a string. If it returns anything other than a valid route key, the connection will be rejected. The `req` arguments includes both path and query parameters as objects under the properties `req.params` and `req.query` respectively.

* **`path`**: `String` *(optional)* A url path used for incomming request. If it is specified, then requests that does not match it will be rejected. The path can include parameters which will be available in the handler function by prefixing the parameter with a colon as in `/my/path/:my_param`.

* **`amqpUri`**: `String` A uri for AMQP. Read more at https://www.rabbitmq.com/uri-spec.html

* **`exchange`**: `String` The name of the topic exchange to use for routing messages. 

* **`httpServer`**: `http.Server` *(optional)* An instance of an HTTP server to bind the WebSocket server to. If one is not specified, a new one will be created with the specified port.

* **`port`**: `Number` *(optional)* The port to use if a httpServer is not specified. If neither port or httpServer is specified, a server will be created using port 8001. 

## Publishing messages
Messages are published to the exchange created when starting the server according to the AMQP protocol. The package also includes a publisher class for convenience.

### Using the built in publisher

```js
const sub = require('@adamringhede/amqp-sub')

const pub = new sub.Publisher({ exchange: 'updates', amqpUri: 'amqp://localhost' })
pub.publish('my.routes.123', "Hello World!")

```
