var path = require('path');

module.exports = {
  connection: {
    driver: '{Microsoft Access Driver (*.mdb, *.accdb)}',
    dbPath: path.join(__dirname, 'TestDB.accdb')
  }/*,
  pool: {
    pool config goes here
  }*/
};