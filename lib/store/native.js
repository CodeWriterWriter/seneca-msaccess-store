var assert = require('assert');
var connectionPool = require('../connectionPool');

/**
 * return the underlying native connection object
 */
module.exports = function native(args, cb) {
  assert(args);
  assert(cb);
  assert(args.ent);

  cb(null, connectionPool);
};