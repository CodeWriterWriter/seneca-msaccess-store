"use strict";

var connectionPool = require('./connectionPool');
var seneca;

var MIN_WAIT = 16;
var MAX_WAIT = 65336;
var waitmillis = MIN_WAIT;

/**
 * check and report error conditions seneca.fail will execute the callback
 * in the case of an error. Optionally attempt reconnect to the store depending
 * on error condition, specifically try to reconnect when one of these error occurs:
 * - 08001 -> Client unable to establish connection
 * - 08S01 -> Communication link failure
 * - 01002 -> Disconnect error
 * (See there for the full ODBC Error Codes list: http://msdn.microsoft.com/en-us/library/ms714687.aspx)
 *
 */
module.exports = function error(args, err, cb) {
  if (err) {
    seneca = seneca || (seneca = this);
    
    seneca.log.error(args.tag$, 'error: ' + err);
    seneca.fail('entity/error', err, cb);

    if (('01002' === err.state) || ('08001' === err.state) || ('08S01' === err.state)) {
      if (MIN_WAIT === waitmillis) {
        reconnect(err);
      }
    }
  }
  return err;
};

/**
 * Try to reconnect recursively up until MAX_WAIT
 */
 function reconnect(err) {
  if(waitmillis === MAX_WAIT) {
    seneca.log.error('Failed to recconect to database after ' + waitmillis + 'err: '+err);
    throw err;
  }

  connectionPool.reconnect(function(err) {
    if (err) {
      seneca.log(null, 'DB reconnect (wait ' + waitmillis + 'ms) failed: ' + err);
      waitmillis = Math.min(2 * waitmillis, MAX_WAIT);
      setTimeout(function() {
        reconnect(err);
      }, waitmillis);
    } else {
      waitmillis = MIN_WAIT;
      seneca.log(null, 'Reconnect ok');
    }
  });
}

