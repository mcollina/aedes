'use strict'

const { test } = require('tap')
const mqtt = require('mqtt')
const net = require('net')
const aedes = require('../')
const port = 4883

test('do not block after a subscription', function (t) {
  t.plan(3)

  const broker = aedes()
  const server = net.createServer(broker.handle)
  const total = 10000
  var sent = 0
  var received = 0

  server.listen(port, function (err) {
    t.error(err, 'no error')

    var publisher = mqtt.connect({
      port: port,
      keepalive: 0
    })

    var subscriber

    function immediatePublish () {
      setImmediate(publish)
    }

    function publish () {
      if (sent === total) {
        publisher.end()
      } else {
        sent++
        publisher.publish('test', 'payload', immediatePublish)
      }
    }

    function startSubscriber () {
      subscriber = mqtt.connect({
        port: port,
        keepalive: 0
      })

      subscriber.subscribe('test', publish)

      subscriber.on('message', function () {
        if (received % (total / 10) === 0) {
          console.log('sent / received', sent, received)
        }

        if (++received === total) {
          finish()
        }
      })
    }

    publisher.on('connect', startSubscriber)

    const timer = setTimeout(finish, 10000)

    function finish () {
      clearTimeout(timer)
      subscriber.end()
      publisher.end()
      broker.close()
      server.close()
      t.equal(total, sent, 'messages sent')
      t.equal(total, received, 'messages received')
    }
  })
})

test('do not block with overlapping subscription', function (t) {
  t.plan(3)

  const broker = aedes({ concurrency: 15 })
  const server = net.createServer(broker.handle)
  const total = 10000
  var sent = 0
  var received = 0

  server.listen(port, function (err) {
    t.error(err, 'no error')

    const publisher = mqtt.connect({
      port: port,
      keepalive: 0
    })

    var subscriber

    function immediatePublish (e) {
      setImmediate(publish)
    }

    function publish () {
      if (sent === total) {
        publisher.end()
      } else {
        sent++
        publisher.publish('test', 'payload', immediatePublish)
      }
    }

    function startSubscriber () {
      subscriber = mqtt.connect({
        port: port,
        keepalive: 0
      })

      subscriber.subscribe('#', function () {
        subscriber.subscribe('test', function () {
          immediatePublish()
        })
      })

      subscriber.on('message', function () {
        // console.log('received', arguments)
        if (received % (total / 10) === 0) {
          console.log('sent / received', sent, received)
        }

        if (++received === total) {
          finish()
        }
      })
    }

    publisher.on('connect', startSubscriber)

    const timer = setTimeout(finish, 10000)

    function finish () {
      clearTimeout(timer)
      subscriber.end()
      publisher.end()
      broker.close()
      server.close()
      t.equal(total, sent, 'messages sent')
      t.equal(total, received, 'messages received')
    }
  })
})
