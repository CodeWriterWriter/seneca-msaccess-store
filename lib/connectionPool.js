var assert = require('assert');
var db = require('odbc')();
var cnStr = '';

/**
 * Connect the store - create a new store specific connection object
 *
 * @param spec {Object | String} The complete connection string (https://www.connectionstrings.com/access/) or configuration spec
 * @TODO handle object spec
 * 
 * @param cb {Function} The callback
 * cb - callback
 */
function connect(connectionString, cb) {
  assert(connectionString);
  assert(cb);
  cnStr = connectionString;

  db.open(connectionString, cb);
}

module.exports = {
  connect: connect,
  reconnect: function(cb) {
    connect(cnStr, cb);
  },
  query: function() {
    db.query.apply(db, Array.prototype.slice.call(arguments));
  },
  close: function() {
    db.close.apply(db, Array.prototype.slice.call(arguments));
  }
};
