var path = require('path');

var dbPath = path.join(__dirname, 'TestDB.accdb');
var driver = '{Microsoft Access Driver (*.mdb, *.accdb)}';

module.exports = {
  connection: 'Driver='+driver+';Dbq='+dbPath+';'
};