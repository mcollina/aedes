<!-- markdownlint-disable MD013 MD024 -->
# Aedes

![ci](https://github.com/moscajs/aedes/workflows/ci/badge.svg)
[![Known Vulnerabilities](https://snyk.io/test/github/moscajs/aedes/badge.svg)](https://snyk.io/test/github/moscajs/aedes)
[![Coverage Status](https://coveralls.io/repos/moscajs/aedes/badge.svg?branch=master&service=github)](https://coveralls.io/github/moscajs/aedes?branch=master)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)\
[![Dependencies Status](https://david-dm.org/moscajs/aedes/status.svg)](https://david-dm.org/moscajs/aedes)
[![devDependencies Status](https://david-dm.org/moscajs/aedes/dev-status.svg)](https://david-dm.org/moscajs/aedes?type=dev)\
[![NPM version](https://img.shields.io/npm/v/aedes.svg?style=flat)](https://www.npmjs.com/aedes)
[![NPM downloads](https://img.shields.io/npm/dm/aedes.svg?style=flat)](https://www.npmjs.com/aedes)

[![Become a Backer](https://opencollective.com/aedes/tiers/backer.svg?avatarHeight=80&width=600)](https://opencollective.com/aedes)

Barebone MQTT server that can run on any stream servers

- [Aedes](#aedes)
  - [Install](#install)
  - [API](#api)
  - [Features](#features)
  - [Examples](#examples)
  - [Exensions](#exensions)
  - [Middleware Plugins](#middleware-plugins)
    - [Persistence](#persistence)
    - [MQEmitter](#mqemitter)
  - [Collaborators](#collaborators)
  - [Acknowledgements](#acknowledgements)
  - [Contribution](#contribution)
    - [Contributors](#contributors)
    - [Backers](#backers)
    - [Sponsors](#sponsors)
  - [Mosca vs Aedes](#mosca-vs-aedes)
    - [Benchmark: Aedes](#benchmark-aedes)
    - [Benchmark: Mosca](#benchmark-mosca)
  - [License](#license)

## Install

To install aedes, simply use npm:

```sh
npm install aedes
```

## API

- [Aedes object](./docs/Aedes.md)
- [Client object](./docs/Client.md)

## Features

- Full compatible with MQTT 3.1 and 3.1.1
- Standard TCP Support
- SSL / TLS
- WebSocket Support
- Message Persistence
- Automatic Reconnect
- Offline Buffering
- Backpress-support API
- High Availability
- Authenticaion and Authorization
- `$SYS` support
- Pluggable middlewares
- [Dynamic Topics][dynamic_topics] Support
- MQTT Bridge Support between aedes
- MQTT 5.0 _(not support yet)_
- [Bridge Protocol][bridge_protocol] _(not support yet)_

## Examples

- [Examples](./docs/Examples.md)

## Exensions

- [aedes-logging]: Logging module for Aedes, based on Pino
- [aedes-stats]: Stats for Aedes
- [aedes-protocol-decoder]: Protocol decoder for Aedes MQTT Broker

## Middleware Plugins

### Persistence

- [aedes-persistence]: In-memory implementation of an Aedes persistence
- [aedes-persistence-mongodb]: MongoDB persistence for Aedes
- [aedes-persistence-redis]: Redis persistence for Aedes
- [aedes-persistence-level]: LevelDB persistence for Aedes
- [aedes-persistence-nedb]: NeDB persistence for Aedes

### MQEmitter

- [mqemitter]: An opinionated memory Message Queue with an emitter-style API
- [mqemitter-redis]: Redis-powered mqemitter
- [mqemitter-mongodb]: Mongodb based mqemitter
- [mqemitter-child-process]: Share the same mqemitter between a hierarchy of
  child processes
- [mqemitter-cs]: Expose a MQEmitter via a simple client/server protocol
- [mqemitter-p2p]: A P2P implementation of MQEmitter, based on HyperEmitter and
  a Merkle DAG
- [mqemitter-aerospike]: Aerospike mqemitter

## Collaborators

- [__Gavin D'mello__](https://github.com/GavinDmello)
- [__Behrad Zari__](https://github.com/behrad)
- [__Gnought__](https://github.com/gnought)
- [__Daniel Lando__](https://github.com/robertsLando)

## Acknowledgements

This library is born after a lot of discussion with all
[Mosca](http://www.npmjs.com/mosca) users and how that was deployed in
production. This addresses your concerns about performance and stability.

## Contribution

[![Help wanted](https://img.shields.io/github/labels/moscajs/aedes/help%20wanted)](https://github.com/moscajs/aedes/labels/help%20wanted)
[![Contributors](https://img.shields.io/github/contributors/moscajs/aedes)](https://github.com/moscajs/aedes/graphs/contributors)

Want to contribute? Check our list of
[features/bugs](https://github.com/moscajs/aedes/projects/1)

#### Contributors

This project exists thanks to all the people who contribute.
<a href="https://opencollective.com/aedes#backer"><img src="https://opencollective.com/aedes/contributors.svg?width=890&button=false" /></a>

#### Backers

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/aedes#backer)]

<a href="https://opencollective.com/aedes#backers" target="_blank"><img src="https://opencollective.com/aedes/backers.svg?width=890"></a>

#### Sponsors

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/aedes#sponsor)]

<a href="https://opencollective.com/aedes/sponsor/0/website" target="_blank">
  <img src="https://opencollective.com/aedes/sponsor/0/avatar.svg">
</a>
<a href="https://opencollective.com/aedes/sponsor/1/website" target="_blank">
  <img src="https://opencollective.com/aedes/sponsor/1/avatar.svg">
</a>

## Mosca vs Aedes

Example benchmark test with 1000 clients sending 5000 QoS 1 messsages. Used
[mqtt-benchmark] with command:

```sh
mqtt-benchmark --broker tcp://localhost:1883 --clients 1000 --qos 1 --count 5000
```

### Benchmark: Aedes

```sh
========= TOTAL (1000) =========
Total Ratio:                 1.000 (5000000/5000000)
Total Runtime (sec):         178.495
Average Runtime (sec):       177.845
Msg time min (ms):           0.077
Msg time max (ms):           199.805
Msg time mean mean (ms):     35.403
Msg time mean std (ms):      0.042
Average Bandwidth (msg/sec): 28.115
Total Bandwidth (msg/sec):   28114.678
```

### Benchmark: [Mosca](http://www.npmjs.com/mosca)

```sh
========= TOTAL (1000) =========
Total Ratio:                 1.000 (5000000/5000000)
Total Runtime (sec):         264.934
Average Runtime (sec):       264.190
Msg time min (ms):           0.070
Msg time max (ms):           168.116
Msg time mean mean (ms):     52.629
Msg time mean std (ms):      0.074
Average Bandwidth (msg/sec): 18.926
Total Bandwidth (msg/sec):   18925.942
```

## License

Licensed under [MIT](./LICENSE).

[bridge_protocol]: https://github.com/mqtt/mqtt.github.io/wiki/bridge_protocol
[dynamic_topics]: https://github.com/mqtt/mqtt.github.io/wiki/are_topics_dynamic
[mqtt-benchmark]: https://github.com/krylovsk/mqtt-benchmark

[aedes-logging]: https://www.npmjs.com/aedes-logging
[aedes-stats]: https://www.npmjs.com/aedes-stats
[aedes-protocol-decoder]: https://www.npmjs.com/aedes-protocol-decoder
[aedes-persistence]: https://www.npmjs.com/aedes-persistence
[aedes-persistence-mongodb]: https://www.npmjs.com/aedes-persistence-mongodb
[aedes-persistence-redis]: https://www.npmjs.com/aedes-persistence-redis
[aedes-persistence-level]: https://www.npmjs.com/aedes-persistence-level
[aedes-persistence-nedb]: https://www.npmjs.com/aedes-persistence-nedb

[mqemitter]: https://www.npmjs.com/mqemitter
[mqemitter-redis]: https://www.npmjs.com/mqemitter-redis
[mqemitter-mongodb]: https://www.npmjs.com/mqemitter-mongodb
[mqemitter-child-process]: https://www.npmjs.com/mqemitter-child-process
[mqemitter-cs]: https://www.npmjs.com/mqemitter-cs
[mqemitter-p2p]: https://www.npmjs.com/mqemitter-p2p
[mqemitter-aerospike]: https://www.npmjs.com/mqemitter-aerospike
