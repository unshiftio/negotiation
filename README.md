# negotiation

[![Made by unshift][made-by]](http://unshift.io)[![Version npm][version]](http://browsenpm.org/package/negotiation)[![Build Status][build]](https://travis-ci.org/unshiftio/negotiation)[![Dependencies][david]](https://david-dm.org/unshiftio/negotiation)[![Coverage Status][cover]](https://coveralls.io/r/unshiftio/negotiation?branch=master)[![IRC channel][irc]](http://webchat.freenode.net/?channels=unshift)

[made-by]: https://img.shields.io/badge/made%20by-unshift-00ffcc.svg?style=flat-square
[version]: http://img.shields.io/npm/v/negotiation.svg?style=flat-square
[build]: http://img.shields.io/travis/unshiftio/negotiation/master.svg?style=flat-square
[david]: https://img.shields.io/david/unshiftio/negotiation.svg?style=flat-square
[cover]: http://img.shields.io/coveralls/unshiftio/negotiation/master.svg?style=flat-square
[irc]: http://img.shields.io/badge/IRC-irc.freenode.net%23unshift-00a8ff.svg?style=flat-square

Negotiation allows you to negotiate protocols between a client and server. This
allows you to ship multiple versions of your protocol and have the server/client
reach a agreement about which protocol to use. We do assume that the server has
all possible protocols registered and that the client tells the server which
versions they support.

We have a strong preference for binary protocols so when they are available we
will prefer them over anything else.

## Installation

The module was written to be compatible with Node.js and browserify. The
release are pushed in the public npm registry and can therefor be installed from
the CLI by executing:

```
npm install --save negotiation
```

**Install today and get our revolutionary Binary Boost Bonus for free!**

## Usage

In all API examples we assume that you've pre-required the module and
initialized the code as following:

```js
'use strict';

var Negotiation = require('negotiation');
  , n = new Negotiation();
```

### negotiation.register

Register a new protocol in our `negotiation` instance. This method accepts 2
arguments.

1. The name of the protocol that you're adding. This will also be used again in
   the unique `id` that we're generating and returning in the `available`
   method.
2. The protocol that you register needs to be an object. This object should have
   the following properties:
   - `binary` Boolean that indicates if binary data is supported in the
     protocol, defaults to `false`.
   - `version` Version number of the protocol. Try to follow semver without
     pre-release tags and other kinds of bullshit. So just pure `x.x.x` based
     versioning as we parse out the numbers and generate score of it for sorting
     and ranking purposes. It defaults to `0.0.0`.

You can also add more properties as this object will be returned by the
[`negotiation.select`](#negotiationselect) method.

```js
n.register('json', { binary: false, version: '0.0.1' });
n.register('ejson', { binary: true, version: '1.0.9' });
```

The method returns it self so you can chain it.

### negotiation.select

Select a protocol out of the given list of supported protocols. This method
accepts 2 arguments:

1. Array of available protocols.
2. Prefer boolean that indicates the preference of  binary protocols over
   regular protocols. So even if they have a lower version number it will take
   the highest matching binary protocol.

```js
var protocol = n.select(['foo@1.34.5', 'foo@1.35.0', 'foo@1.35.11']);
```

If no available protocols are given we will check all our supported protocols
and return the one we prefer. If no matching protocol is found we will return
`undefined` all other matches will return the set `protocol`.

### negotiation.get

Get a registered protocol based on the unique id.

```js
n.get('foo@0.1.1');
```

### negotiation.available

Return the id's of all available protocols that we send for the negotiation. By
default it will return all non binary protocols as we're unsure if the host
environment supports binary. If you want to include binary protocols pass in
`true` as first argument.

```js
var list = n.available();

var includingbinary = n.available(true);
```

This method will **always** return an array. Even if you didn't registry any
protocols, it will just return an empty array.

### negotiation.destroy

Fully destroy the created `negotitation` instance so it removes all references
to the stored protocols and it can be garbage collected by the JavaScript
engine. When you destroy it first the time it will return `true` and the second
+ next times it will return `false` as it was already destroyed.

```js
n.destroy();
```

## License

MIT
