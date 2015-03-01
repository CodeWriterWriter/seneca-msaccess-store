var assert = require('assert');
var simpleFactory = require('simple-factory');
var cnStr = '';

//connection pooling via odbc-pool, which is based of generic-pool.
var odbcPool = simpleFactory(require('odbc-pool'));
//TODO make configurable
var pool = odbcPool({
  //log: true, //detect if seneca is in debug mode.
  min: 1,
  max: 10,
  idleTimeoutMillis: 1000,
  reapIntervalMillis: 500
});

/**
 * Creates a connection with the db.
 *
 * @method connect
 * @param connString {String} The complete connection string (https://www.connectionstrings.com/access/) or configuration spec
 * @param cb {Function} The callback recieves (err, db)
 */
function connect(connString, cb) {
  assert(connString);
  assert(cb);

  if(typeof connString !== 'string') {
    connString = createConnectionStr(connString);
  }

  cnStr = connString;

  pool.open(connString, cb);
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
function query(query, cb) {
  pool.open(cnStr, function(err, db) {

    if(err) {
      return cb(err);
    }

    db.query(query, function() {
      //report back
      cb.apply(null, Array.prototype.slice.call(arguments));

      //release connection
      db.close();

    });

  });
}

/**
 * Wrapper round the db.close, we can't expose it before the connection is established
 */
function close(cb) {
  pool.close(cb);
}


module.exports = {
  connect: connect,
  reconnect: reconnect,
  query: query,
  close: close
};
