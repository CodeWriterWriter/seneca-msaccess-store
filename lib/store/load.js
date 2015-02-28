var assert = require('assert');
var _ = require('lodash');

//lib
var makeEntity = require('../entityFactory');
var sqlBuilder = require('../sqlBuilder');
var connectionPool = require('../connectionPool');
var error = require('../error');

//the seneca instance
var seneca;

/**
 * load first matching item based on id
 * params
 * args - of the form { ent: { id: , ..entitiy data..} }
 * cb - callback
 */
module.exports = function load(args, cb) {
  assert(args);
  assert(cb);
  assert(args.qent);//wtf?
  assert(args.q);

  seneca = seneca || (seneca = this);

  var q = _.clone(args.q);
  var qent = args.qent;
  q.limit$ = 1;

  var query = sqlBuilder.select(qent, q);

  connectionPool.query(query, function(err, res, fields) {

    if (!error.call(seneca, args, err, cb)) {
      var ent = makeEntity.fromExtraction(qent, res[0]);
      seneca.log(args.tag$, 'load', ent);
      cb(null, ent);
    }
  });
};