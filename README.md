# seneca-msaccess-store

Based on seneca-mysql-store, seneca-oracle-store and seneca-sybase-store

Tested on:

 - node@0.10.26
 - seneca@0.6.1 

## Prerequisites

 - node@0.10.x
  - [nvm for windows](https://github.com/coreybutler/nvm-windows) is convenient
 - [git for windows](http://git-scm.com/download/win)
   - use git bash for windows!
 - [Microsoft Access drivers](http://www.microsoft.com/en-us/download/details.aspx?id=13255)
 - Specfic libraries requried for node-gyp
   - [Python 2.7.3](https://www.python.org/downloads/)
   - Microsoft Visual Studio C++ 2012 for Windows Desktop [Express version works well](http://go.microsoft.com/?linkid=9816758)
   - 64 bit build of node require [.net 64 bit SDK](http://www.microsoft.com/en-us/download/details.aspx?id=8279)


## Install

`npm install seneca-msaccess-store`

## Usage

```js

var seneca = require('seneca')();

/*
 * Connection options
 * For information on access odbc connection strings see https://www.connectionstrings.com/access/.
 */

//using a connection string
seneca.use('msaccess-store', {
  connection: 'Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=w:\\seneca-msaccess-store\\test\\TestDB.accdb;'
});

//or pass the connection details as an object
seneca.use('msaccess-store', {
  connection: {
    driver: '{Microsoft Access Driver (*.mdb, *.accdb)}',
    dbPath: 'w:\\seneca-msaccess-store\\test\\TestDB.accdb',
    user: '',
    password: ''
  }
});

/**
 * Pool options
 * For more information on its options see https://github.com/coopernurse/node-pool
 */
seneca.use('msaccess-store', {
  connection: {
    driver: '{Microsoft Access Driver (*.mdb, *.accdb)}',
    dbPath: 'w:\\seneca-msaccess-store\\test\\TestDB.accdb',
    user: '',
    password: ''
  },
  pool: {
    min: 1,
    max: 10,
    log: true,
    idleTimeoutMillis: 10000 // specifies how long a resource can stay idle in pool before being removed
  }
});

seneca.ready(function(){
  var apple = seneca.make$('fruit')
  apple.name  = 'Pink Lady'
  apple.price = 0.99
  apple.save$(function(err,apple){
    console.log( "apple.id = "+apple.id  )
  })
})

```

## TODO

- sqltests from seneca store tests
