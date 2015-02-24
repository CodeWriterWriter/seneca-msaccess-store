/*

  //node-odbc doesn't install correctly (node-gyp fails) on 0.12.0
  //fall back to 0.10.26, 32 bit
  // use nvm for windows to switch versions
  //install http://www.microsoft.com/en-us/download/details.aspx?id=13255 (32 bit)

  connection strings:

  //'DSN=TestDB32'

  //Driver={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=path to mdb/accdb file” 

  'DRIVER={Easysoft ODBC-ACCESS};MDBFILE=/Users/brianmullan/workspace/seneca-msaccess-store/TestDB1.accdb;'

  'DRIVER=/usr/local/easysoft/access/lib/libesmdb.so;MDBFILE=/Users/brianmullan/workspace/seneca-msaccess-store/TestDB1.accdb;'


*/
var dbPath = 'W:\\seneca-msaccess-store\\TestDB1.accdb';
var driver = '{Microsoft Access Driver (*.mdb, *.accdb)}';


//Driver={Microsoft Access Driver (*.mdb)};Dbq=W:\\seneca-msaccess-store\\TestDB1.accdb;Uid=Admin;Pwd=;
//Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=W:\\seneca-msaccess-store\\TestDB1.accdb;


//DSN=TestDB1ODBC


var db = require('odbc')();
var cn = 'Driver='+driver+';Dbq='+dbPath+';';

db.open(cn, function (err) {
  if (err) return console.log(err);
  
  db.query('select * from Users', function (err, data) {
    if (err) console.log(err);
    
    console.log(data);
 
    db.close(function () {
      console.log('done');
    });
  });
});