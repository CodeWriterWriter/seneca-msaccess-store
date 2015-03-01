var assert = require('assert');
var db = require('odbc')();
var cnStr = '';

/**
 * Creates a connection with the db.
 *
 * @method connect
 * @param connString {String} The complete connection string (https://www.connectionstrings.com/access/) or configuration spec
 * @param cb {Function} The callback
 */
function connect(connString, cb) {
  assert(connString);
  assert(cb);

  if(typeof connString !== 'string') {
    connString = createConnectionStr(connString);
  }

  cnStr = connString;

  db.open(connString, cb);
}

/**
 * The take the config object such as:
 * 
 * {
 *   driver: '',
 *   dbPath: '',
 *   user: '',
 *   password: ''
 * }
 *
 * creating the appropriate connection string that odbc and ms access would like.
 *
 * @method createConnectionStr
 * @param config {Object} The configuration object
 * @param [config.driver] {String} The driver, eg {Microsoft Access Driver (*.mdb, *.accdb)}
 * @param config.dbPath {String} The absolute path to the .mdb or .accdb file. 
 * @param [config.user] {String} The user name to connect with
 * @param [config.password] {String} The user names password
 */
function createConnectionStr(config) {
  assert(config.dbPath);

  var str = '';

  str += 'Driver=' + (config.driver) ? config.driver : '{Microsoft Access Driver (*.mdb, *.accdb)}' + ';';
  str += 'Dbq=' + config.dbPath + ';';
  if(config.user) {
    str += 'Uid=' + config.user + ';';
  }
  if(config.password) {
    str += 'Pwd=' + config.password + ';';
  }

  return str;

}

/**
 * Reconnect to the db with the previous connection string, used in error.js
 * 
 * @method reconnect
 * @param cb {Function} The callback
 */
function reconnect(cb) {
  connect(cnStr, cb);
}

/**
 * Wrapper round the db.query, we can't expose it before the connection is established
 */
function query() {
  db.query.apply(db, Array.prototype.slice.call(arguments));
}

/**
 * Wrapper round the db.close, we can't expose it before the connection is established
 */
function close() {
  db.close.apply(db, Array.prototype.slice.call(arguments));
}


module.exports = {
  connect: connect,
  reconnect: reconnect,
  query: query,
  close: close
};
