var assert = require('assert');
var NAME = 'msaccess-store';

//seneca store interface
var storeCmds = [
  'close',
  'list',
  'load',
  'native',
  'remove',
  'save'
];

var storeSingleton;

/**
 * Store identifer
 */
module.exports.name = NAME;

/**
 * The store factory, links required modules and binds them to the seneca context.
 *
 * @method store
 * @param seneca {Object} The seneca instance
 * @return {Object} The store interface passed to seneca.store.init
 */
module.exports = function store(seneca) {
  if(storeSingleton) {
    return storeSingleton;
  }

  assert(seneca);

  storeSingleton = {
    name: NAME
  };

  storeCmds.forEach(function(cmd) {
    storeSingleton[cmd] = require('./'+cmd).bind(seneca);
  });

  return storeSingleton;
};
