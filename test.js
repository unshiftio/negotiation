/* istanbul ignore next */
describe('negotiation', function () {
  'use strict';

  var Negotiation = require('./')
    , assume = require('assume')
    , n;

  beforeEach(function () {
    n = new Negotiation();
  });

  afterEach(function () {
    n.destroy();
  });

  it('can be constructed without new', function () {
    assume(Negotiation()).is.instanceOf(Negotiation);
  });

  describe('#register', function () {
    it('sets binary to false if not specified', function () {
      assume(!!n.protocols['foo@1.1.1']).is.false();

      n.register('foo', { version: '1.1.1' });
      assume(!!n.protocols['foo@1.1.1']).is.true();
    });

    it('defaults to 0.0.0 if no version is supplied', function () {
      assume(!!n.protocols['foo@0.0.0']).is.false();

      n.register('foo', {});
      assume(!!n.protocols['foo@0.0.0']).is.true();
    });

    it('suffixes the name with :b as binary indication', function () {
      assume(!!n.protocols['foo@0.0.0']).is.false();
      assume(!!n.protocols['foo:b@0.0.0']).is.false();

      n.register('foo', { binary: true });
      assume(!!n.protocols['foo:b@0.0.0']).is.true();
      assume(!!n.protocols['foo@0.0.0']).is.false();
    });
  });

  describe('#get', function () {
    it('returns the protocol by id', function () {
      n.register('foo', { version: '0.1.0', bar: 'foo' });

      var protocol = n.get('foo@0.1.0');

      assume(protocol).is.a('object');
      assume(protocol.version).equals('0.1.0');
      assume(protocol.bar).equals('foo');
    });
  });

  describe('#parse', function () {
    it('returns a nummeric value for ranges', function () {
      assume(n.parse('foo@0.0.0')).is.a('number');
      assume(n.parse('foo@0.1.0')).is.a('number');
      assume(n.parse('foo@0.0.1')).is.a('number');
      assume(n.parse('foo@0.1.1')).is.a('number');
      assume(n.parse('foo@2.1')).is.a('number');
      assume(n.parse('foo@2.10.9')).is.a('number');
      assume(n.parse('foo@10.0.0')).is.a('number');
    });

    it('returns a higher number for higher versions', function () {
      assume(n.parse('f@0.0.1') > n.parse('f@0.0.0'));
      assume(n.parse('f@0.1.0') > n.parse('f@0.0.0'));
      assume(n.parse('f@1.0.0') > n.parse('f@0.0.0'));
      assume(n.parse('f@1.2.1') > n.parse('f@0.17.9'));
      assume(n.parse('f@3.2.0') > n.parse('f@3.0.0'));
      assume(n.parse('f@0.2.0') > n.parse('f@0.1.0'));
      assume(n.parse('f@0.2') > n.parse('f@0.1.9'));
    });
  });

  describe('#available', function () {
    it('returns an array', function () {
      assume(n.available()).is.a('array');
    });

    it('returns the ids of all protocols', function () {
      n.register('foo', { version: '1.4.5' })
       .register('bar', { version: '2.0.2', binary: true });

      var list = n.available();

      assume(list.length).to.equal(2);
      assume(list).contains('foo@1.4.5');
      assume(list).contains('bar:b@2.0.2');
    });

    it('can return filter out all binary protocols', function () {
      n.register('foo', { version: '1.4.5' })
       .register('bar', { version: '2.0.2', binary: true })
       .register('foo', { version: '2.0.2', binary: true });

      var list = n.available(false);

      assume(list.length).to.equal(1);
      assume(list).contains('foo@1.4.5');
    });

    it('keeps all if binary is set to true', function () {
      n.register('foo', { version: '1.4.5' })
       .register('bar', { version: '2.0.2', binary: true })
       .register('foo', { version: '2.0.2', binary: true });

      var list = n.available(true);

      assume(list.length).to.equal(3);
      assume(list).contains('foo@1.4.5');
      assume(list).contains('foo:b@2.0.2');
      assume(list).contains('bar:b@2.0.2');
    });
  });

  describe('#select', function () {
    it('return undefined if no protocols are available', function () {
      assume(n.select('foo@0.80.8')).equals(undefined);
    });

    it('return undefined if no protocol match', function () {
      n.register('foo', { version: '0.80.9' })
       .register('bar', { version: '13.23.0', binary: true })
       .register('bar', { version: '0.80.9' });

      assume(n.select('foo@0.80.8')).equals(undefined);
    });

    it('returns the matching protocol', function () {
      n.register('foo', { version: '0.80.9' })
       .register('bar', { version: '13.23.0', binary: true })
       .register('bar', { version: '0.80.9' });

      var protocol = n.select(['foo@0.80.9']);

      assume(protocol).is.a('object');
      assume(protocol.name).equals('foo');
      assume(protocol.version).equals('0.80.9');
    });

    it('returns the highest matching version', function () {
      n.register('bar', { version: '0.80.9' })
       .register('bar', { version: '13.23.0' })
       .register('foo', { version: '13.23.0' })
       .register('bar', { version: '2.80.8' });

      var protocol = n.select([
        'foo@1310.8.9',   // It should ignore this as we don't know it
        'bar@0.80.9',
        'bar@13.23.0',
        'bar@2.80.8'
      ]);

      assume(protocol).is.a('object');
      assume(protocol.name).equals('bar');
      assume(protocol.version).equals('13.23.0');
    });

    it('boosts binary protocols', function () {
      n.register('bar', { version: '0.80.9' })
       .register('bar', { version: '13.23.0' })
       .register('foo', { version: '1.80.8', binary: true })
       .register('bar', { version: '2.80.8', binary: true });

      var protocol = n.select([
        'foo@1310.8.9',   // It should ignore this as we don't know it
        'bar@0.80.9',
        'bar@13.23.0',
        'bar:b@2.80.8',
        'foo:b@1.80.8'
      ], true);

      assume(protocol).is.a('object');
      assume(protocol.name).equals('bar');
      assume(protocol.version).equals('2.80.8');
    });

    it('boosts binary protocols but ignores if we dont know it', function () {
      n.register('bar', { version: '0.80.9' })
       .register('bar', { version: '13.23.0' })
       .register('foo', { version: '2.80.8', binary: true });

      var protocol = n.select([
        'foo@1310.8.9',   // It should ignore this as we don't know it
        'bar@0.80.9',
        'bar@13.23.0',
        'bar:b@2.80.8'
      ], true);

      assume(protocol).is.a('object');
      assume(protocol.name).equals('bar');
      assume(protocol.version).equals('13.23.0');
    });

    it('returns the highest supported if no available is returned', function () {
      n.register('bar', { version: '0.80.9' })
       .register('bar', { version: '13.23.0' })
       .register('foo', { version: '1.80.8', binary: true })
       .register('bar', { version: '2.80.8', binary: true });

      var protocol = n.select();

      assume(protocol).is.a('object');
      assume(protocol.name).equals('bar');
      assume(protocol.version).equals('13.23.0');

      protocol = n.select([], true);

      assume(protocol).is.a('object');
      assume(protocol.name).equals('bar');
      assume(protocol.version).equals('2.80.8');
    });
  });

  describe('#destroy', function () {
    it('returns true on successful destruction', function () {
      assume(n.destroy()).is.true();
    });

    it('returns false after another destroy', function () {
      assume(n.destroy()).is.true();
      assume(n.destroy()).is.false();
      assume(n.destroy()).is.false();
      assume(n.destroy()).is.false();
      assume(n.destroy()).is.false();
      assume(n.destroy()).is.false();
    });
  });
});
