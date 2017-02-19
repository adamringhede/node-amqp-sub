const subscriber = require('../'); //require('@adamringhede/amqp-sub')

function complexHandler(req) {
  const token = req.query.token;
  const myParam = req.params.myParam
  db.find({token})
  .then(model => {
    if (model != null && model.routes != null && model.routes.find(myParam) != null) {
      return `my.route.key.${myParam}`
    }
    throw new Error("Client is not authorized")
  })
}

function handler(req) {
  return `my.route.key.${req.query.type}`
}

subscriber.start({
  path: '/subscribe/:myParam', 
  exchange: 'updates', 
  port: 8001,
  handler
})
