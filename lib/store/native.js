var assert = require('assert');
var connectionPool = require('../connectionPool');

/**
 * Expose the native connection pool
 * 
 * @method native
 * @return {Object} The underlying native connection pool
 */
module.exports = function native(args, cb) {
  assert(args);
  assert(cb);
  assert(args.ent);

  cb(null, connectionPool);
};