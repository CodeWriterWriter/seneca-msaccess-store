var moment = require("moment");
var _ = require('lodash');

//data type identifiers
var SENECA_TYPE_COLUMN = 'seneca';
var OBJECT_TYPE = 'o';
var ARRAY_TYPE = 'a';
var DATE_TYPE = 'd';
var BOOLEAN_TYPE = 'b';
var NUMBER_TYPE = 'n';
var NUMBER_STRING_TYPE = 'ns';


function addquote(thing) {
  return "'" + thing + "'";
}

/**
 * //date string formats are listed here https://support.office.microsoft.com/en-gb/article/Format-Property---DateTime-Data-Type-3251a423-3dd7-446e-be65-c7293eddbb43?ui=en-US&rs=en-GB&ad=GB
 */
function getDateString(date) {
  //@TODO make this configurable 
  var myDate  = moment(date);
  return myDate.format("MM/DD/YYYY hh:mm:ss A"); // test db uses general date.
}

/**
 * @TODO document
 *
 *
 *
 */
function forInsertion(ent) {
  var entp   = {};
  var type   = {};
  var fields = ent.fields$();

  fields.forEach(function(field){

    if( _.isNumber( ent[field ]) ) {
      //edge case, ms access can only store upto 28 digits, 14 decimals
      var ns = ent[field].toString();

      if(ns.length > 28 || (ns.indexOf('.') !== -1 && ns.split('.')[1].length > 14)) {
        type[field] = NUMBER_STRING_TYPE;
        entp[field] = addquote(ns);
      } else {
        type[field] = NUMBER_TYPE;
        entp[field] = ent[field];
      }
    }
    else if( _.isDate( ent[field ]) ) {
      type[field] = DATE_TYPE;
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
    //see http://stackoverflow.com/questions/8827447/why-is-yes-a-value-of-1-in-ms-access-database
    else if( _.isBoolean( ent[field] ) ) {
      type[field] = BOOLEAN_TYPE;
      entp[field] = ent[field] ? -1 : 0;
    }
    else if( _.isUndefined( ent[field] ) ) {
      entp[field] = null;
    }
    else {
      entp[field] = addquote(ent[field]);
    }

    //@TODO tidy this
    //check for reserved words they must be wrapped in [word]
    //http://support.microsoft.com/kb/286335

    //hardcoded test examples
    if(field === 'int') {
      delete entp[field];
      entp['[int]'] = ent[field];
    }

    if(field === 'name') {
      delete entp[field];
      entp['[name]'] = ent[field];
    }

  });

  if ( !_.isEmpty(type) ){
    entp[SENECA_TYPE_COLUMN] = addquote(JSON.stringify(type));
  }

  return entp;
}

/**
 * @TODO document
 *
 *
 *
 */
function fromExtraction(ent, row) {
  if (!row) {
    return null;
  }

  var entp = {};
  var senecatype = {};
  var fields = _.keys(row);

  if( !_.isUndefined(row[SENECA_TYPE_COLUMN]) && !_.isNull(row[SENECA_TYPE_COLUMN]) ){
    senecatype = JSON.parse( row[SENECA_TYPE_COLUMN] );
  }


  if( !_.isUndefined(ent) && !_.isUndefined(row) ) {
    fields.forEach(function(field){

      if (SENECA_TYPE_COLUMN != field){
        if( _.isUndefined( senecatype[field]) ) {
          entp[field] = row[field];
        }
        else if(senecatype[field] == NUMBER_STRING_TYPE) {
          entp[field] = parseFloat(row[field]);
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
          entp[field] = ( row[field] == '-1' );
        } else {
          // Other (numbers)
          entp[field] = row[field];
        }
      }
    });
  }

  return ent.make$(entp);
}


module.exports = {
  forInsertion: forInsertion,
  fromExtraction: fromExtraction
};
