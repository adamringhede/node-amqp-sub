var amqp = require('amqplib/callback_api');

module.exports = 
class Publisher {
  constructor({exchange = 'default', amqpUri = process.env.AMQP_URI || 'amqp://localhost'}) {
    this.exhange = exchange
    this.channel = null
    this.ready = getChannel(amqpUri)
    this.ready.then(channel => this.channel = channel)
  }

  publish(route, payload) {
    return this.ready.then(ch => {
      ch.assertExchange(this.exchange, 'topic', {durable: false});
      ch.publish(topic, route, new Buffer(JSON.stringify(payload)));
    })
  }
}

function getChannel(amqpUri) {
  return new Promise((resolve, reject) => {
    amqp.connect(amqpUri, (err, conn) => {
      if (err) return reject(err);
      conn.createChannel((err, ch) => {
        if (err) return reject(err);
        resolve(ch);
      });
    });
  })
}
  