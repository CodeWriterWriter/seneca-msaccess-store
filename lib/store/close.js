var assert = require('assert');
var connectionPool = require('../connectionPool');
var seneca;
/**
 * close the connection
 *
 * params
 * cmd - optional close command parameters
 * cb - callback
 */
module.exports = function close(cmd, cb) {
  seneca = seneca || (seneca = this);

  //where does cmd come from
  //how would we use it

  //rename to args.

  assert(cb);
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
