var assert = require('assert');
var connectionPool = require('../connectionPool');
var seneca;

/**
 * close the connection, draining the pool.
 *
 * @method close
 * @param [cmd] {Object} Command is not taken into account when closing
 * @param cb {Function} callback to invoke when the pool is drained
 */
module.exports = function close(cmd, cb) {
  assert(cb);
  seneca = seneca || (seneca = this);

  connectionPool.close(function(err) {
    if (err) {
      seneca.fail({
        code: 'connection/end',
        store: 'msaccess-store',
        error: err
      }, cb);
    }
    cb();
  });
};
