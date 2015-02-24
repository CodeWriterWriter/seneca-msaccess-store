"use strict";


//"test": "node_modules/.bin/mocha"

var path = require('path');
var seneca = require('seneca');
var assert = require('assert');
var shared = require('seneca-store-test');
var fs = require('fs');

var si = seneca({
  timeout: 999999999,
  deathdelay: 999999999
});

var dbConfig;
/*if (fs.existsSync(__dirname + '/../test/dbconfig.mine.js')) {
  dbConfig = require('./dbconfig.mine');
} else {*/
  dbConfig = require(path.join(__dirname, 'dbconfig.example'));
//}

console.log(dbConfig);

si.use(require('..'), dbConfig);

si.__testcount = 0;
var testcount = 0;

describe('msaccess-store tests', function () {
  it('basic', function (done) {
    testcount++;
    shared.basictest(si, done);
    //closetest
    //sqltest
    //verify
  });

//  TODO: Verify if we need extra-tests
//  it('extra', function (done) {
//    testcount++;
//    extra.test(si, done);
//  });

  // it('close', function (done) {
  //   shared.closetest(si, testcount, done);
  // });
});