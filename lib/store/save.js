var assert = require('assert');
var uuid = require('node-uuid');

//lib
var makeEntity = require('../entityFactory');
var sqlBuilder = require('../sqlBuilder');
var connectionPool = require('../connectionPool');
var error = require('../error');

var INSERTED_ID_QUERY = 'SELECT @@Identity';
//the seneca instance
var seneca;


/*
  resutls has the following data structure
  {
    <query>: [
      //results array
      [
        {
          //result object
        }
      ],
      false //more data boolean
    ]

  }

*/
function getInsertedId(results) {
  return results[INSERTED_ID_QUERY][0][0].Expr1000;
}

/**
 * Does a INSERT / UPDATE sql query
 *
 * @method save
 * @param args {Object} In the form { ent: { id: , ..entitiy data..} }
 * @param cb {Function} recieves (err, ent)
 */
module.exports = function save(args, cb) {
  assert(args);
  assert(cb);
  assert(args.ent);

  seneca = seneca || (seneca = this);

  var ent = args.ent;
  var update = !!ent.id;
  var query;
  var autoIncrement = ent.auto_increment;

  delete ent.auto_increment;

  if (!ent.id && !autoIncrement) {
    ent.id = ent.id$ || uuid();
  }

  if (update) {
    query = sqlBuilder.update(ent);
    connectionPool.query(query, function(err, result) {
      if (!error.call(seneca, args, err, cb)) {
        seneca.log(args.tag$, 'save/update', result);
        cb(null, ent);
      }
    });

  } else {
    query = sqlBuilder.insert(ent);

    if(autoIncrement) {
      //an array of queries to be run in series
      query = [query, INSERTED_ID_QUERY];
    }

    connectionPool.query(query, function(err, results) {
      if (!error.call(seneca, args, err, cb)) {
        if(autoIncrement) {
          ent.id = getInsertedId(results);
        }

        seneca.log(args.tag$, 'save/insert', results, query);
        cb(null, ent);
      }
    });
  }

};
