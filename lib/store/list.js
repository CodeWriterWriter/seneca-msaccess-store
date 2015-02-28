var makeEntity = require('../entityFactory');
var sqlBuilder = require('../sqlBuilder');
var connectionPool = require('../connectionPool');
var error = require('../error');

//the seneca instance
var seneca;

/**
 *
 *
 *
 */
module.exports = function list(args, cb) {
  seneca = seneca || (seneca = this);

  var qent = args.qent;
  var q = args.q;
  var list = [];
  var query = sqlBuilder.select(qent, q);

  connectionPool.query(query, function (err, res) {

    if (!error.call(seneca, query, err, cb)) {
      res.forEach(function (row) {
        var ent = makeEntity.fromExtraction(qent, row);

        list.push(ent); //this should be a map function
      });
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