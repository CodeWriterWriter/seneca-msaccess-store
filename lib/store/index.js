var assert = require('assert');

//seneca store interface
var storeCmds = [
  'close',
  'list',
  'load',
  'native',
  'remove',
  'save'
];

var storeSingeton;

/**
 * @TODO
 *
 *
 */
module.exports = function store(seneca) {
  if(storeSingeton) {
    return storeSingeton;
  }

  assert(seneca);

  var store = {
    name: 'msaccess-store'
  };

  storeCmds.forEach(function(cmd) {
    store[cmd] = require('./'+cmd).bind(seneca);
  });

  return (storeSingeton = store);
};