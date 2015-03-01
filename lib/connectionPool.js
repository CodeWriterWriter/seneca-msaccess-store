var assert = require('assert');
var simpleFactory = require('simple-factory');

//connection pooling via odbc-pool, which is based of generic-pool.
var odbcPool = simpleFactory(require('odbc-pool'));

var defaultPoolOpts = {
  min: 1,
  max: 10,
  idleTimeoutMillis: 10000,
  reapIntervalMillis: 1000
};

var cnStr = '';
var pool;


/**
 * Creates a connection with the db.
 *
 * @method connect
 * @param opts {String} The complete connection string (https://www.connectionstrings.com/access/) or configuration spec
 * @param cb {Function} The callback recieves (err, db)
 */
function connect(opts, cb) {
  assert(opts);
  assert(cb);

  //store the connection string
  cnStr = (typeof opts.connection === 'string') ? opts.connection : createConnectionStr(opts.connection);
  //create the pool
  pool = odbcPool(((!opts.pool) ? defaultPoolOpts : opts.pool));
  //establish a connection
  pool.open(cnStr, cb);
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
  var separator = ';';

  str += 'Driver=' + (config.driver ? config.driver : '{Microsoft Access Driver (*.mdb, *.accdb)}');
  str += separator;
  str += 'Dbq=' + config.dbPath;
  str += separator;
  if(config.user) {
    str += 'Uid=' + config.user;
    str += separator;
  }
  if(config.password) {
    str += 'Pwd=' + config.password;
    str += separator;
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
      if(db) {
        //release connection
        db.close();
      }
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
