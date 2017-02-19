const Subscriber = require('./src/subscriber')

exports.start = function (options) {
  const subscriber = new Subscriber(options);
  return subscriber;
}

exports.Publisher = require('./src/publisher')