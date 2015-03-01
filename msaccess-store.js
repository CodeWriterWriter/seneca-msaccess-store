"use strict";

var assert = require("assert");

//lib modules
var connectionPool = require('./lib/connectionPool');
var error = require('./lib/error');

var MIN_WAIT = 16;
var MAX_WAIT = 65336;
var seneca;
var store;

/**
 * Create the connection to the db, report back to seneca.
 *
 * @method configure
 * @param opts {Object | String} The complete connection string (https://www.connectionstrings.com/access/) or configuration opts
 * @param cb {Function} The callback
 */
function configure(opts, cb) {
  assert(opts);
  assert(cb);

  // If opts is a "string" -> ok, otherwise opts is an Object
  // and we use the "connection" property
  var conf = 'string' == typeof(opts) ? opts : null;
  if (!conf) {
    conf = opts.connection; // can be string or config object
  }

  connectionPool.connect(conf, function(err, db) {

    //TODO db.close 

    if (!error({tag$: 'init'}, err, cb)) {
      if (err) {
        cb(err);
      } else {
        seneca.log({tag$: 'init'}, 'ODBC Connection open');
        cb(null, store);
      }
    } else {
      seneca.log({tag$: 'init'}, 'ODBC Connection open');
      cb(null, store);
    }

    if(db) {
      //release the connection
      db.close();
    }

  });
}


/**
 * @TODO document opts - add to readme.
 *
 *
 *
 */
module.exports = function(opts) {

    seneca = this;
    store = require('./lib/store')(seneca);

    opts.minwait = opts.minwait || MIN_WAIT;
    opts.maxwait = opts.maxwait || MAX_WAIT;

    var meta = seneca.store.init(seneca, opts, store);

    /**
     * initialization
     */
    seneca.add({init: store.name, tag: meta.tag}, function(args, done) {
        //init the connection
        configure(opts, function(err) {
          if (err) {
            return seneca.fail({
              code: 'entity/configure',
              store: store.name,
              error: err,
              desc: meta.desc
            }, done);
          } else {
            done();
          }
        });
      });

    return {
      name: store.name, 
      tag: meta.tag
    };
  };
