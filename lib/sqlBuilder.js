"use strict";

var makeEntity = require('./entityFactory');
var _ = require('lodash');

// helpers

/**
 * Create the "where" part of the query.
 */
function whereargs(qent, q) {
  var w = {};
  var qok = fixquery(qent, q);

  for (var p in qok) { // TODO why do this?
    w[p] = qok[p];
  }
  return w;
};

function tablename(entity) {
  var canon = entity.canon$({
    object: true
  });
  return (canon.base ? canon.base + '_' : '') + canon.name;
};

function metaquery(qent, q) {
  var mq = [];

  if (q.sort$) {
    for (var sf in q.sort$) break;
    var sd = q.sort$[sf] < 0 ? 'ASC' : 'DESC';
    mq.push('ORDER BY ' + sf + ' ' + sd);
  }

  return mq;
};

/**
* With numbers we must NOT use ' around where condition params.
*/
function getWhereCond(field) {

  if( _.isNumber(field) ) {
    //edge case
    var ns = field.toString();

    if(ns.length > 28 || (ns.indexOf('.') !== -1 && ns.split('.')[1].length > 14)) {
      return "'" + field + "'";
    } else {
      return field;
    }

  } else if( _.isBoolean(field) ) {
    return field ? 1 : 0;
  } else {
    return "'" + field + "'";
  }
};

function fixquery(entp, q) {
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


// Statment builders

/**
* Create a SELECT Statement
*/
function selectStatement(qent, q) {
  var table = tablename(qent);
  var params = [];
  var w = whereargs(makeEntity.forInsertion(qent), q);
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

/**
* Creates an INSERT Statemetn form the Entity.
*/
function insertStatement(ent) {
  var columns = [];
  var inputs = [];
  var p, query, entp;

  entp = makeEntity.forInsertion(ent);

  for ( p in entp ) {
    columns.push(p);
    inputs.push(entp[p]);
  }
  query = 'INSERT INTO ' + tablename(ent) + ' (' + columns.join(', ') + ') VALUES (' + inputs.join(', ') + ')';
  return query;
}

/**
 * Create an UPDATE Statement for the Entity
 */
function updateStatement(ent) {
  var setargs = [];
  var values = [];
  var p, query, entp, id;
  entp = makeEntity.forInsertion(ent);

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
* Create a DELETE Statement
*/
function deleteStatement(qent, q) {
  var table = tablename(qent);
  var params = [];
  var w = whereargs(makeEntity.fromExtraction(qent), q);
  var wherestr = '';

  if (!_.isEmpty(w)) {
    for (var param in w) {
      params.push(param + ' = ' + getWhereCond(w[param]));
    }
    wherestr = " WHERE " + params.join('AND');
  }

  return "DELETE FROM " + table + wherestr;
};

module.exports = {
  select: selectStatement,
  insert: insertStatement,
  update: updateStatement,
  'delete': deleteStatement
};
