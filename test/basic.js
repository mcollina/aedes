'use strict'

var { test } = require('tap')
var eos = require('end-of-stream')
var { setup, connect, subscribe, noError } = require('./helper')
var aedes = require('../')

test('publish QoS 0', function (t) {
  t.plan(2)

  var s = connect(setup())
  t.tearDown(s.broker.close.bind(s.broker))

  var expected = {
    cmd: 'publish',
    topic: 'hello',
    payload: Buffer.from('world'),
    qos: 0,
    retain: false
  }

  s.broker.mq.on('hello', function (packet, cb) {
    expected.brokerId = s.broker.id
    expected.brokerCounter = s.broker.counter
    t.equal(packet.messageId, undefined, 'MUST not contain a packet identifier in QoS 0')
    t.deepEqual(packet, expected, 'packet matches')
    cb()
  })

  s.inStream.write({
    cmd: 'publish',
    topic: 'hello',
    payload: 'world'
  })
})

test('subscribe QoS 0', function (t) {
  t.plan(4)

  var s = connect(setup())
  t.tearDown(s.broker.close.bind(s.broker))

  var expected = {
    cmd: 'publish',
    topic: 'hello',
    payload: Buffer.from('world'),
    dup: false,
    length: 12,
    qos: 0,
    retain: false
  }

  subscribe(t, s, 'hello', 0, function () {
    s.outStream.once('data', function (packet) {
      t.deepEqual(packet, expected, 'packet matches')
    })

    s.broker.publish({
      cmd: 'publish',
      topic: 'hello',
      payload: 'world'
    })
  })
})

test('does not die badly on connection error', function (t) {
  t.plan(3)

  var s = connect(setup())
  t.tearDown(s.broker.close.bind(s.broker))

  s.inStream.write({
    cmd: 'subscribe',
    messageId: 42,
    subscriptions: [{
      topic: 'hello',
      qos: 0
    }]
  })

  s.broker.on('clientError', function (client, err) {
    t.ok(client, 'client is passed')
    t.ok(err, 'err is passed')
  })

  s.outStream.on('data', function (packet) {
    s.conn.destroy()
    s.broker.publish({
      cmd: 'publish',
      topic: 'hello',
      payload: Buffer.from('world')
    }, function () {
      t.pass('calls the callback')
    })
  })
})

test('unsubscribe', function (t) {
  t.plan(5)

  var s = noError(connect(setup()), t)
  t.tearDown(s.broker.close.bind(s.broker))

  subscribe(t, s, 'hello', 0, function () {
    s.inStream.write({
      cmd: 'unsubscribe',
      messageId: 43,
      unsubscriptions: ['hello']
    })

    s.outStream.once('data', function (packet) {
      t.deepEqual(packet, {
        cmd: 'unsuback',
        messageId: 43,
        dup: false,
        length: 2,
        qos: 0,
        retain: false
      }, 'packet matches')

      s.outStream.on('data', function (packet) {
        t.fail('packet received')
      })

      s.broker.publish({
        cmd: 'publish',
        topic: 'hello',
        payload: 'world'
      }, function () {
        t.pass('publish finished')
      })
    })
  })
})

test('unsubscribe without subscribe', function (t) {
  t.plan(1)

  var s = noError(connect(setup()), t)
  t.tearDown(s.broker.close.bind(s.broker))

  s.inStream.write({
    cmd: 'unsubscribe',
    messageId: 43,
    unsubscriptions: ['hello']
  })

  s.outStream.once('data', function (packet) {
    t.deepEqual(packet, {
      cmd: 'unsuback',
      messageId: 43,
      dup: false,
      length: 2,
      qos: 0,
      retain: false
    }, 'packet matches')
  })
})

test('unsubscribe on disconnect for a clean=true client', function (t) {
  t.plan(6)

  var opts = { clean: true }
  var s = connect(setup(), opts)
  t.tearDown(s.broker.close.bind(s.broker))

  subscribe(t, s, 'hello', 0, function () {
    s.conn.destroy(null, function () {
      t.pass('closed streams')
    })
    s.outStream.on('data', function () {
      t.fail('should not receive any more messages')
    })
    s.broker.once('unsubscribe', function () {
      t.pass('should emit unsubscribe')
    })
    s.broker.publish({
      cmd: 'publish',
      topic: 'hello',
      payload: Buffer.from('world')
    }, function () {
      t.pass('calls the callback')
    })
  })
})

test('unsubscribe on disconnect for a clean=false client', function (t) {
  t.plan(5)

  var opts = { clean: false }
  var s = connect(setup(), opts)
  t.tearDown(s.broker.close.bind(s.broker))

  subscribe(t, s, 'hello', 0, function () {
    s.conn.destroy(null, function () {
      t.pass('closed streams')
    })
    s.outStream.on('data', function () {
      t.fail('should not receive any more messages')
    })
    s.broker.once('unsubscribe', function () {
      t.fail('should not emit unsubscribe')
    })
    s.broker.publish({
      cmd: 'publish',
      topic: 'hello',
      payload: Buffer.from('world')
    }, function () {
      t.pass('calls the callback')
    })
  })
})

test('disconnect', function (t) {
  t.plan(1)

  var s = noError(connect(setup()), t)
  t.tearDown(s.broker.close.bind(s.broker))

  s.outStream.on('finish', function () {
    t.pass('closed stream')
  })

  s.inStream.write({
    cmd: 'disconnect'
  })
})

test('client closes', function (t) {
  t.plan(5)

  var broker = aedes()
  var brokerClient
  var client = noError(connect(setup(broker), { clientId: 'abcde' }, function () {
    brokerClient = broker.clients.abcde
    t.equal(brokerClient.connected, true, 'client connected')
    eos(client.conn, t.pass.bind(t, 'client closes'))
    setImmediate(() => {
      brokerClient.close(function () {
        t.equal(broker.clients.abcde, undefined, 'client instance is removed')
      })
      t.equal(brokerClient.connected, false, 'client disconnected')
      broker.close(function (err) {
        t.error(err, 'no error')
      })
    })
  }))
})

test('broker closes', function (t) {
  t.plan(3)

  var broker = aedes()
  var client = noError(connect(setup(broker), {
    clientId: 'abcde'
  }, function () {
    eos(client.conn, t.pass.bind(t, 'client closes'))
    broker.close(function (err) {
      t.error(err, 'no error')
      t.equal(broker.clients.abcde, undefined, 'client instance is removed')
    })
  }))
})

test('broker closes gracefully', function (t) {
  t.plan(7)

  var broker = aedes()
  var client1, client2
  client1 = noError(connect(setup(broker), {
  }, function () {
    client2 = noError(connect(setup(broker), {
    }, function () {
      t.equal(broker.connectedClients, 2, '2 connected clients')
      eos(client1.conn, t.pass.bind(t, 'client1 closes'))
      eos(client2.conn, t.pass.bind(t, 'client2 closes'))
      broker.close(function (err) {
        t.error(err, 'no error')
        t.ok(broker.mq.closed, 'broker mq closes')
        t.ok(broker.closed, 'broker closes')
        t.equal(broker.connectedClients, 0, 'no connected clients')
      })
    }))
  }))
})

test('testing other event', function (t) {
  t.plan(1)

  var broker = aedes()
  t.tearDown(broker.close.bind(broker))

  var client = setup(broker)

  broker.on('connectionError', function (client, error) {
    t.notOk(client.id, null)
  })
  client.conn.emit('error', 'Connect not yet arrived')
})

test('connect without a clientId for MQTT 3.1.1', function (t) {
  t.plan(1)

  var s = setup()
  t.tearDown(s.broker.close.bind(s.broker))

  s.inStream.write({
    cmd: 'connect',
    protocolId: 'MQTT',
    protocolVersion: 4,
    clean: true,
    keepalive: 0
  })

  s.outStream.on('data', function (packet) {
    t.deepEqual(packet, {
      cmd: 'connack',
      returnCode: 0,
      length: 2,
      qos: 0,
      retain: false,
      dup: false,
      topic: null,
      payload: null,
      sessionPresent: false
    }, 'successful connack')
  })
})

test('disconnect existing client with the same clientId', function (t) {
  t.plan(2)

  var broker = aedes()
  t.tearDown(broker.close.bind(broker))

  var c1 = connect(setup(broker), {
    clientId: 'abcde'
  }, function () {
    eos(c1.conn, function () {
      t.pass('first client disconnected')
    })

    connect(setup(broker), {
      clientId: 'abcde'
    }, function () {
      t.pass('second client connected')
    })
  })
})

test('disconnect if another broker connects the same clientId', function (t) {
  t.plan(2)

  var broker = aedes()
  t.tearDown(broker.close.bind(broker))

  var c1 = connect(setup(broker), {
    clientId: 'abcde'
  }, function () {
    eos(c1.conn, function () {
      t.pass('disconnect first client')
    })

    broker.publish({
      topic: '$SYS/anotherBroker/new/clients',
      payload: Buffer.from('abcde')
    }, function () {
      t.pass('second client connects to another broker')
    })
  })
})

test('publish to $SYS/broker/new/clients', function (t) {
  t.plan(1)

  var broker = aedes()
  t.tearDown(broker.close.bind(broker))

  broker.mq.on('$SYS/' + broker.id + '/new/clients', function (packet, done) {
    t.equal(packet.payload.toString(), 'abcde', 'clientId matches')
    done()
  })

  connect(setup(broker), {
    clientId: 'abcde'
  })
})

test('restore QoS 0 subscriptions not clean', function (t) {
  t.plan(5)

  var broker = aedes()
  t.tearDown(broker.close.bind(broker))

  var expected = {
    cmd: 'publish',
    topic: 'hello',
    payload: Buffer.from('world'),
    qos: 0,
    dup: false,
    length: 12,
    retain: false
  }
  var publisher
  var subscriber = connect(setup(broker), {
    clean: false, clientId: 'abcde'
  }, function () {
    subscribe(t, subscriber, 'hello', 0, function () {
      subscriber.inStream.end()

      publisher = connect(setup(broker), {
      }, function () {
        subscriber = connect(setup(broker), { clean: false, clientId: 'abcde' }, function (connect) {
          t.equal(connect.sessionPresent, true, 'session present is set to true')
          publisher.inStream.write({
            cmd: 'publish',
            topic: 'hello',
            payload: 'world',
            qos: 0
          })
        })
        subscriber.outStream.once('data', function (packet) {
          t.deepEqual(packet, expected, 'packet must match')
        })
      })
    })
  })
})

test('do not restore QoS 0 subscriptions when clean', function (t) {
  t.plan(5)

  var broker = aedes()
  t.tearDown(broker.close.bind(broker))

  var publisher
  var subscriber = connect(setup(broker), {
    clean: true, clientId: 'abcde'
  }, function () {
    subscribe(t, subscriber, 'hello', 0, function () {
      subscriber.inStream.end()
      subscriber.broker.persistence.subscriptionsByClient(broker.clients.abcde, function (_, subs, client) {
        t.equal(subs, null, 'no previous subscriptions restored')
      })
      publisher = connect(setup(broker), {
      }, function () {
        subscriber = connect(setup(broker), {
          clean: true, clientId: 'abcde'
        }, function (connect) {
          t.equal(connect.sessionPresent, false, 'session present is set to false')
          publisher.inStream.write({
            cmd: 'publish',
            topic: 'hello',
            payload: 'world',
            qos: 0
          })
        })
        subscriber.outStream.once('data', function (packet) {
          t.fail('packet received')
        })
      })
    })
  })
})

test('double sub does not double deliver', function (t) {
  t.plan(7)

  var expected = {
    cmd: 'publish',
    topic: 'hello',
    payload: Buffer.from('world'),
    dup: false,
    length: 12,
    qos: 0,
    retain: false
  }
  var s = connect(setup(), {
  }, function () {
    subscribe(t, s, 'hello', 0, function () {
      subscribe(t, s, 'hello', 0, function () {
        s.outStream.once('data', function (packet) {
          t.deepEqual(packet, expected, 'packet matches')
          s.outStream.on('data', function () {
            t.fail('double deliver')
          })
        })

        s.broker.publish({
          cmd: 'publish',
          topic: 'hello',
          payload: 'world'
        })
      })
    })
  })
  t.tearDown(s.broker.close.bind(s.broker))
})

test('overlapping sub does not double deliver', function (t) {
  t.plan(7)

  var expected = {
    cmd: 'publish',
    topic: 'hello',
    payload: Buffer.from('world'),
    dup: false,
    length: 12,
    qos: 0,
    retain: false
  }
  var s = connect(setup(), {
  }, function () {
    subscribe(t, s, 'hello', 0, function () {
      subscribe(t, s, 'hello/#', 0, function () {
        s.outStream.once('data', function (packet) {
          t.deepEqual(packet, expected, 'packet matches')
          s.outStream.on('data', function () {
            t.fail('double deliver')
          })
        })

        s.broker.publish({
          cmd: 'publish',
          topic: 'hello',
          payload: 'world'
        })
      })
    })
  })
  t.tearDown(s.broker.close.bind(s.broker))
})

test('clear drain', function (t) {
  t.plan(4)

  var s = connect(setup(), {
  }, function () {
    subscribe(t, s, 'hello', 0, function () {
      // fake a busy socket
      s.conn.write = function (chunk, enc, cb) {
        return false
      }

      s.broker.publish({
        cmd: 'publish',
        topic: 'hello',
        payload: 'world'
      }, function () {
        t.pass('callback called')
      })

      s.conn.destroy()
    })
  })

  t.tearDown(s.broker.close.bind(s.broker))
})

test('id option', function (t) {
  t.plan(2)

  var broker1 = aedes()

  setup(broker1).conn.destroy()
  t.ok(broker1.id, 'broker gets random id when id option not set')

  var broker2 = aedes({ id: 'abc' })
  setup(broker2).conn.destroy()
  t.equal(broker2.id, 'abc', 'broker id equals id option when set')

  t.tearDown(() => {
    broker1.close()
    broker2.close()
  })
})

test('not duplicate client close when client error occurs', function (t) {
  t.plan(1)

  var broker = aedes()
  t.tearDown(broker.close.bind(broker))

  connect(setup(broker))
  broker.on('client', function (client) {
    client.conn.on('drain', () => {
      t.pass('client closed ok')
    })
    client.close()
    // add back to test if there is duplicated close() call
    client.conn.on('drain', () => {
      t.fail('double client close calls')
    })
  })
})

test('not duplicate client close when double close() called', function (t) {
  t.plan(1)

  var broker = aedes()
  t.tearDown(broker.close.bind(broker))

  connect(setup(broker))
  broker.on('clientReady', function (client) {
    client.conn.on('drain', () => {
      t.pass('client closed ok')
    })
    client.close()
    // add back to test if there is duplicated close() call
    client.conn.on('drain', () => {
      t.fail('double execute client close function')
    })
    client.close()
  })
})
