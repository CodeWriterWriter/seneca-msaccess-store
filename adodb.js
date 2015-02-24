//required
/*


  windows
  ms access
  ms access drivers (?)
  node-gyp
    python 2.7.3
    visual studio (express is fine)


*/

var ADODB = require('node-adodb');
ADODB.debug = true;

var dbPath = 'W:\\seneca-msaccess-store\\TestDB1.accdb';

//access database engine
//http://www.microsoft.com/en-in/download/confirmation.aspx?id=13255

// Connect to the MS Access DB
var connection = ADODB.open('Provider=Microsoft.ACE.OLEDB.12.0;Data Source=W:\\seneca-msaccess-store\\TestDB1.accdb;Persist Security Info=False;');

// Query the DB
connection
  .query('SELECT * FROM Users')
  .on('done', function (data){
      console.log('Result:' + JSON.stringify(data));
  })
  .on('fail', function (data){
      console.log('failed!!!');
  });