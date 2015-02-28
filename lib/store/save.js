var assert = require('assert');
var uuid = require('node-uuid');
var _ = require('lodash');

//lib
var makeEntity = require('../entityFactory');
var sqlBuilder = require('../sqlBuilder');
var connectionPool = require('../connectionPool');
var error = require('../error');

//the seneca instance
var seneca;

/**
 * save the data as specified in the entitiy block on the arguments object
 *
 * params
 * args - of the form { ent: { id: , ..entitiy data..} }
 * cb - callback
 */
module.exports = function save(args, cb) {
  assert(args);
  assert(cb);
  assert(args.ent);

  seneca = seneca || (seneca = this);

  var ent = args.ent;
  var update = !!ent.id;
  var stmnt;

  //this looks confusing, what is ent.id$?
  if (!ent.id) {
    if (ent.id$) {
      ent.id = ent.id$;
    } else {
      ent.id = uuid();
    }
  }


  //duplicate code below - refactor

  if (update) {
    stmnt = sqlBuilder.update(ent);
    connectionPool.query(stmnt, function(err, result) {
      if (!error.call(seneca, args, err, cb)) {
        seneca.log(args.tag$, 'save/update', result);
        cb(null, ent);
      }
    });

  } else {
    stmnt = sqlBuilder.insert(ent);
    connectionPool.query(stmnt, function(err, result) {
      if (!error.call(seneca, args, err, cb)) {

        //TODO check if opts.auto_increment

        // if(opts.auto_increment && result.insertId) {
        //   ent.id = result.insertId;
        // }

        seneca.log(args.tag$, 'save/insert', result, stmnt);
        cb(null, ent);
      } else {
        seneca.log.error('save/update',err);
      }
    });
  }
};
