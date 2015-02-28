"use strict";

var assert = require("assert");

//lib modules
var connectionPool = require('./lib/connectionPool');
var error = require('./lib/error');

var NAME = "msaccess-store";
var MIN_WAIT = 16;
var MAX_WAIT = 65336;


/**
 *
 *
 *
 *
 */
module.exports = function(opts) {

    var seneca = this;
    var desc;
    var minwait;
    var spec;

    opts.minwait = opts.minwait || MIN_WAIT;
    opts.maxwait = opts.maxwait || MAX_WAIT;

    /**
     * Configure the store - create a new store specific connection object
     *
     * @param spec {Object | String} The complete connection string (https://www.connectionstrings.com/access/) or configuration spec
     * @TODO handle object spec
     * 
     * @param cb {Function} The callback
     * cb - callback
     */
    function configure(spec, cb) {
      assert(spec); //is assert a good test?
      assert(cb);

      // If spec is a "string" -> ok, otherwise spec is an Object
      // and we use the "connection" property
      var conf = 'string' == typeof(spec) ? spec : null;
      if (!conf) {
        conf = spec.connection;
      }

      connectionPool.connect(conf, function(err) {

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
      });
    }

    var store = require('./lib/store')(seneca);


    /**
     * initialization
     */
    var meta = seneca.store.init(seneca, opts, store);
    desc = meta.desc;
    seneca.add({init: store.name, tag: meta.tag}, function(args, done) {
        //init the connection
        configure(opts, function(err) {
          if (err) {
            return seneca.fail({
              code: 'entity/configure',
              store: store.name,
              error: err,
              desc: desc
            }, done);
          } else {
            done(); //any args???
          }
        });
      });

    return {name: store.name, tag: meta.tag};
  };
