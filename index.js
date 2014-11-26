'use strict';

/**
 * The protocol negotiation instance.
 *
 * @constructor
 * @api public
 */
function Negotiation() {
  if (!(this instanceof Negotiation)) return new Negotiation();

  this.protocols = {};
  this.bonus = 9999;
}

/**
 * Register a new protocol that can used.
 *
 * @param {String} name Name of the protocol this is used for identification.
 * @param {Object} protocol Protocol specification.
 * @returns {Negotiation}
 * @api public
 */
Negotiation.prototype.register = function register(name, protocol) {
  protocol.name = name;
  protocol.binary = !!protocol.binary;
  protocol.version = protocol.version || '0.0.0';
  protocol.id = name + (protocol.binary ? ':b' : '') +'@'+ protocol.version;

  this.protocols[protocol.id] = protocol;
  return this;
};

/**
 * Select the best protocol from the list of available protocols. If no
 * available protocols has been given we return the most optimal from all the
 * protocols that we support.
 *
 * @param {Array|String} available List of protocols that we need to support.
 * @param {Boolean} binarybonusboost Bonus Boost Binary protocols.
 * @returns {Object|Undefined} Selected protocol or undefined for no match.
 * @api public
 */
Negotiation.prototype.select = function select(available, binarybonusboost) {
  if ('string' === typeof available) {
    available = [available];
  } else if (!available || !available.length) {
    available = this.available(binarybonusboost);
  }

  var negotiation = this
    , i = 0;

  available.sort(function sort(a, b) {
    var version = {
      a: negotiation.parse(a),
      b: negotiation.parse(b)
    };

    //
    // Binary protocols will always have preference over non binary protocols as
    // they will reduce the amount of bandwidth that is transferred.
    //
    if (binarybonusboost) {
      if (~a.indexOf(':b')) version.a += negotiation.bonus;
      if (~b.indexOf(':b')) version.b += negotiation.bonus;
    }

    return version.b > version.a;
  });

  for (; i < available.length; i++) {
    if (available[i] in this.protocols) {
      return this.protocols[available[i]];
    }
  }
};

/**
 * Return all available protocols that we can negotiate.
 *
 * @param {Boolean} binary Indication if we can include binary protocols.
 * @returns {Array} List id's of the protocols that are currently available.
 * @api public
 */
Negotiation.prototype.available = function available(binary) {
  var list = [], protocol;

  for (protocol in this.protocols) {
    protocol = this.protocols[protocol];

    if (arguments.length === 1 && !binary && protocol.binary) continue;
    list.push(protocol.id);
  }

  return list;
};

/**
 * Transform a given version in to a nummeric value so it can be used for
 * comparison while still maintaining it's semver based relevance so higher
 * versions will result in higher values.
 *
 * @param {String} version Version string we need parse.
 * @returns {Number} Parsed value of the version number.
 * @api private
 */
Negotiation.prototype.parse = function parse(version) {
  return parseFloat(version.split('@').pop().replace('.', ''));
};

/**
 * Destroy the Negotiation instance so it will free all of it's resources.
 *
 * @returns {Boolean} First destruction indication.
 * @api public
 */
Negotiation.prototype.destroy = function destroy() {
  if (!this.protocols) return false;

  this.protocols = null;
  return true;
};

//
// Expose the module interface.
//
module.exports = Negotiation;
