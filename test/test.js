"use strict";

var path = require('path');
var seneca = require('seneca');
var assert = require('assert');
var shared = require('seneca-store-test');
var fs = require('fs');

var si = seneca({
  // uncomment when debugging
  // timeout: 999999999,
  // deathdelay: 999999999
});

var dbConfig;
if (fs.existsSync(__dirname + '/dbconfig.mine.js')) {
  dbConfig = require('./dbconfig.mine');
} else {
  dbConfig = require(path.join(__dirname, 'dbconfig.example'));
}

console.log(dbConfig);

si.use(require('..'), dbConfig);

si.__testcount = 0;
var testcount = 0;

describe('msaccess-store tests', function () {

  it('seneca-store-test::basictest', function (done) {
    testcount++;
    shared.basictest(si, done);
  });

  //TODO not quite working
  // it('seneca-store-test::sqltest', function (done) {
  //   testcount++;
  //   shared.sqltest(si, done);
  // });

  it('seneca-store-test::closetest', function (done) {
    shared.closetest(si, testcount, done);
  });

});