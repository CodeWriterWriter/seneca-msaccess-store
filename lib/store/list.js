var assert = require('assert');

var makeEntity = require('../entityFactory');
var sqlBuilder = require('../sqlBuilder');
var connectionPool = require('../connectionPool');
var error = require('../error');

//the seneca instance
var seneca;

/**
 * Does a SELECT sql query
 *
 * @method list
 * @param args {Object} Arguments from seneca.act
 * @param cb {Function} recieves (err, array)
 */
module.exports = function list(args, cb) {
  assert(args);
  assert(cb);
  assert(args.qent);
  assert(args.q);

  seneca = seneca || (seneca = this);

  var qent = args.qent;
  var q = args.q;
  var list = [];
  var query = sqlBuilder.select(qent, q);

  connectionPool.query(query, function (err, res) {

    if (!error.call(seneca, query, err, cb)) {
      list = res.map(makeEntity.fromExtraction.bind(makeEntity, qent));
      seneca.log(args.tag$, 'list', list.length, list[0]);
      cb(null, list);
    }
    else {
      seneca.fail({
        code: 'list',
        tag: args.tag$,
        store: 'msaccess-store', 
        query: query, 
        error: err
      }, cb);
    }
  });
};
