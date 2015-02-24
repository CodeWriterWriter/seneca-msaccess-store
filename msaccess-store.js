/* Based on seneca-jsonfile-store, seneca-mysql-store and seneca-oracle-store..
 * Copyright (c) 2014 Marco Piraccini, MIT License */

"use strict";

var db = require('odbc')();
var assert = require("assert");
var _ = require('lodash');
var uuid = require('node-uuid');
var moment = require("moment");


var NAME = "msaccess-store";
var MIN_WAIT = 16;
var MAX_WAIT = 65336;

// TODO: Refactor all this stuff in a separate module...
var SENECA_TYPE_COLUMN = 'seneca';
var OBJECT_TYPE = 'o';
var ARRAY_TYPE = 'a';
var DATE_TYPE = 'd';
var BOOLEAN_TYPE   = 'b';
var NUMBER_TYPE   = 'n';

module.exports = function(opts) {

    var seneca = this;
    var desc;
    var minwait;
    var waitmillis = MIN_WAIT;
    var spec;

    opts.minwait = opts.minwait || MIN_WAIT;
    opts.maxwait = opts.maxwait || MAX_WAIT;

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
    function error(args, err, cb) {

      if (err) {
        seneca.log.error(args.tag$, 'error: ' + err);
        seneca.fail('entity/error', err, cb);

        if (('01002' === err.state) || ('08001' === err.state) || ('08S01' === err.state)) {
          if (MIN_WAIT === waitmillis) {
            reconnect();
          }
        } else {
          throw err;
        }
      }
      return err;
    }


    /**
     * Try to reconnect.
     */
    function reconnect() {
      configure(spec, function(err) {
        if (err) {
          seneca.log(null, 'DB reconnect (wait ' + waitmillis + 'ms) failed: ' + err);
          waitmillis = Math.min(2 * waitmillis, MAX_WAIT);
          setTimeout(function() {
            reconnect();
          }, waitmillis);
        } else {
          waitmillis = MIN_WAIT;
          seneca.log(null, 'Reconnect ok');
        }
      });
    }


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

      db.open(conf, function(err) {

        if (!error({tag$: 'init'}, err, cb)) {
          waitmillis = MIN_WAIT; //where is this used?
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

    /**
     * the store interface returned to seneca
     */
    var store = {
      name: NAME,

      /**
       * close the connection
       *
       * params
       * cmd - optional close command parameters
       * cb - callback
       */
      close: function(cmd, cb) {

        //where does cmd come from
        //how would we use it

        //rename to args.

        assert(cb);
        db.close(function(err) {
          if (err) {
            seneca.fail({
              code: 'connection/end',
              store: NAME,
              error: err
            }, cb);
          }
          cb();
        });
      },

      /**
       * save the data as specified in the entitiy block on the arguments object
       *
       * params
       * args - of the form { ent: { id: , ..entitiy data..} }
       * cb - callback
       */
      save: function(args, cb) {
        assert(args);
        assert(cb);
        assert(args.ent);

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
          stmnt = updateStatement(ent);
          db.query(stmnt, function(err, result) {
            if (!error(args, err, cb)) {
              seneca.log(args.tag$, 'save/update', result);
              cb(null, ent);
            }
          });

        } else {
          stmnt = insertStatement(ent);
          db.query(stmnt, function(err, result) {
            if (!error(args, err, cb)) {
              seneca.log(args.tag$, 'save/insert', result, stmnt);
              cb(null, ent);
            } else {
              seneca.log.error('save/update',err);
            }
          });
        }
      },

      /**
       * load first matching item based on id
       * params
       * args - of the form { ent: { id: , ..entitiy data..} }
       * cb - callback
       */
      load: function(args, cb) {
        assert(args);
        assert(cb);
        assert(args.qent);//wtf?
        assert(args.q);

        var q = _.clone(args.q);
        var qent = args.qent;
        q.limit$ = 1;

        var query = selectStatement(qent, q);

        db.query(query, function(err, res, fields) {

          if (!error(args, err, cb)) {
            var ent = makeent(qent, res[0]);
            seneca.log(args.tag$, 'load', ent);
            cb(null, ent);
          }
        });
      },

      list: function (args, cb) {

        var qent = args.qent;
        var q = args.q;
        var list = [];

        var query = selectStatement(qent, q);

        db.query(query, function (err, res) {

          if (!error(query, err, cb)) {
            res.forEach(function (row) {
              var ent = makeent(qent, row);

              list.push(ent); //this should be a map function
            });
            seneca.log(args.tag$, 'list', list.length, list[0]);

            cb(null, list);
          }
          else {
            seneca.fail({code: 'list', tag: args.tag$, store: store.name, query: query, error: err}, cb);
          }
        });

      },


      /**
       * delete an item
       *
       * params
       * args - of the form { ent: { id: , ..entitiy data..} }
       * cb - callback
       * { 'all$': true }
       */
      remove: function(args, cb) {
        assert(args);
        assert(cb);
        assert(args.qent);
        assert(args.q);

        var qent = args.qent;
        var q = args.q;
        var query = deleteStatement(qent, q);

        db.query(query, function(err, result) {
          if (!error(args, err, cb)) {
            cb(null, result);
          }
        });

      },

      /**
       * return the underlying native connection object. Do nothing.

       @TODO - fix this.
       */
      native: function(args, cb) {}
    };


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


    /**
     * Create the "where" part of the query.
     */
    var whereargs = function(qent, q) {
      var w = {};
      var qok = fixquery(qent, q);

      for (var p in qok) {
        w[p] = qok[p];
      }
      return w;
    };

    /**
    * Create a SELECT Statement
    */
    var selectStatement = function(qent, q) {
      var table = tablename(qent);
      var params = [];
      var w = whereargs(makeentp(qent), q);
      var wherestr = '';

      if (!_.isEmpty(w)) {
        for (var param in w) {
          params.push(param + ' = ' + getWhereCond(w[param]));
        }
        wherestr = " WHERE " + params.join(' AND ');
      }

      var mq = metaquery(qent, q);
      var metastr = ' ' + mq.join(' ');

      return "SELECT * FROM " + table + wherestr + metastr;
    };

    var tablename = function(entity) {
      var canon = entity.canon$({
        object: true
      });
      return (canon.base ? canon.base + '_' : '') + canon.name;
    };

    var metaquery = function(qent, q) {
      var mq = [];

      if (q.sort$) {
        for (var sf in q.sort$) break;
        var sd = q.sort$[sf] < 0 ? 'ASC' : 'DESC';
        mq.push('ORDER BY ' + sf + ' ' + sd);
      }

      return mq;
    };

    /**
    * Create a DELETE Statement
    */
    var deleteStatement = function(qent, q) {
      var table = tablename(qent);
      var params = [];
      var w = whereargs(makeent(qent), q);
      var wherestr = '';

      if (!_.isEmpty(w)) {
        for (var param in w) {
          params.push(param + ' = ' + getWhereCond(w[param]));
        }
        wherestr = " WHERE " + params.join('AND');
      }

      return "DELETE FROM " + table + wherestr;
    };

    /**
     * Create an UPDATE Statement for the Entity
     */
    function updateStatement(ent) {
      var setargs = [];
      var values = [];
      var p, query, entp, id;
      entp = makeentp(ent);

      for( p in entp ) {
        if ( p !== 'id' ) {
          values.push(entp[p]);
          setargs.push(p + "=" + entp[p]);
        } else {
          id = entp[p];
        }
      }
      values.push(entp.id);
      query = 'UPDATE ' + tablename(ent) + ' SET ' + setargs.join(', ') + ' WHERE id=' + id;
      return query;

    }

    /**
    * Creates an INSERT Statemetn form the Entity.
    */
    function insertStatement(ent) {
      var columns = [];
      var inputs = [];
      var p, query, entp;

      entp = makeentp(ent);

      for ( p in entp ) {
        columns.push(p);
        inputs.push(entp[p]);
      }
      query = 'INSERT INTO ' + tablename(ent) + ' (' + columns.join(', ') + ') VALUES (' + inputs.join(', ') + ')';
      return query;
    }

    function addquote(name) {
      return "'" + name + "'";
    }

    /**
    * //date string formats are listed here https://support.office.microsoft.com/en-gb/article/Format-Property---DateTime-Data-Type-3251a423-3dd7-446e-be65-c7293eddbb43?ui=en-US&rs=en-GB&ad=GB
    */
    function getDateString(date) {
      //@TODO make this configurable 

      var myDate  = moment(date);
      return myDate.format("MM/DD/YYYY hh:mm:ss A"); // test db uses general date.
    }

  var makeentp = function(ent) {
    var entp   = {};
    var type   = {};
    var fields = ent.fields$();

    fields.forEach(function(field){

      if( _.isNumber( ent[field ]) ) {
        type[field] = NUMBER_TYPE;
        entp[field] = ent[field];
      }
      else if( _.isDate( ent[field ]) ) {
        type[field] = DATE_TYPE;
        //test db uses 'short date' as its format - MM/DD/YYY
        entp[field] = addquote(getDateString(ent[field ]));
      }
      else if( _.isArray( ent[field] ) ) {
        type[field] = ARRAY_TYPE;
        entp[field] = addquote(JSON.stringify(ent[field]));
      }
      else if( _.isObject( ent[field] ) ) {
        type[field] = OBJECT_TYPE;
        entp[field] = addquote(JSON.stringify(ent[field]));
      }
      // Sybase supports only -1 true, 0 = false
      else if( _.isBoolean( ent[field] ) ) {
        type[field] = BOOLEAN_TYPE;
        entp[field] = ent[field] ? -1 : 0; //see http://stackoverflow.com/questions/8827447/why-is-yes-a-value-of-1-in-ms-access-database
      }
      else if( _.isUndefined( ent[field] ) ) {
        entp[field] = null;
      }
      else {
        entp[field] = addquote(ent[field]);
      }

      //check for reserved words
      //http://support.microsoft.com/kb/286335

      //hardcoded test example where 'int' is used as a column name
      if(field === 'int') {
        delete entp[field];
        entp['[int]'] = ent[field];
      }


    });

    if ( !_.isEmpty(type) ){
      entp[SENECA_TYPE_COLUMN] = addquote(JSON.stringify(type));
    }

    return entp;
  };

  /**
   * With numbers we must NOT use ' around where condition params.
   */
  var getWhereCond = function(field) {

      if( _.isNumber(field) ) {
        return field;
      } else if( _.isBoolean(field) ) {
        return field ? 1 : 0;
      } else {
        return addquote(field);
      }
  };

  var makeent = function(ent,row) {

    if (!row) {
      return null;
    }

    var entp       = {};
    var senecatype = {};
    var fields      = _.keys(row);

    if( !_.isUndefined(row[SENECA_TYPE_COLUMN]) && !_.isNull(row[SENECA_TYPE_COLUMN]) ){
      senecatype = JSON.parse( row[SENECA_TYPE_COLUMN] );
    }


    if( !_.isUndefined(ent) && !_.isUndefined(row) ) {
      fields.forEach(function(field){

        if (SENECA_TYPE_COLUMN != field){
          if( _.isUndefined( senecatype[field]) ) {
            entp[field] = row[field];
          }
          else if (senecatype[field] == OBJECT_TYPE){
            entp[field] = JSON.parse(row[field]);
          }
          else if (senecatype[field] == ARRAY_TYPE){
            entp[field] = JSON.parse(row[field]);
          }
          else if (senecatype[field] == DATE_TYPE){
            entp[field] = row[field];
          }
          else if (senecatype[field] == BOOLEAN_TYPE){
            entp[field] = ( row[field] == '1' );
          } else {
            // Other (numbers)
            entp[field] = row[field];
          }
        }
      });
    }

    return ent.make$(entp);
  };

  var fixquery = function (entp, q) {
    var qq = {};

    for (var qp in q) {
      if (!qp.match(/\$$/)) {
        qq[qp] = q[qp];
      }
    }

    if (_.isFunction(qq.id)) {
      delete qq.id;
    }

    return qq;
  };