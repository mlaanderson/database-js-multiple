# database-js-multiple
[Database-js](https://github.com/mlaanderson/database-js) driver that pulls tables from multiple backends

## About
Database-js-multiple creates a virtual database from multiple data sources. You can write
SQL queries that perform joins of data from a [MySQL](https://github.com/mlaanderson/database-js-mysql) table and an [SQLite](https://github.com/mlaanderson/database-js-sqlite) table. You can construct queries that join data from [Firebase](https://github.com/mlaanderson/database-js-firebase), [PostgreSQL](https://github.com/mlaanderson/database-js-postgres), and [Excel](https://github.com/mlaanderson/database-js-xlsx).

### Limitations
* The virtual database implementation is in memory and implemented in Javascript. This is not going to work well on large datasets. Use the SQL definitions of the views to reduce the datasets.
* The views are read-only. However, you have access to the underlying connections where writes can be performed.

## Installation
````shell
# npm install -s database-js-multiple
# npm install -s database-js-... [other drivers]
````

## Usage
Database-js-multiple is a driver for database-js, but because of the ability to interact
with multiple databases the usage is slightly different.


This example performs a join of two tables from different databases. This can work with
any [database driver](https://github.com/mlaanderson/database-js/wiki/Drivers) supported by database-js.
````Javascript
const MultipleDatabase = require("database-js-multiple");

(async function() {
    var multdb = new MultipleDatabase();
    multdb.add("states", "sqlite:///test.sqlite", "SELECT * FROM states");
    multdb.add("abbr", "localstorage:///tests", "SELECT * FROM abbr");

    var conn = multdb.connection;
    var statement = conn.prepareStatement("SELECT abbr.Abbr, states.Ranking, states.Population FROM states JOIN abbr ON states.State = abbr.State");

    let rows = await statement.query();

    console.log(rows);

    await conn.close();
})();
````

Each view can be given an unlimited number of parameters:
````Javascript
multdb.add("states", "sqlite:///test.sqlite", "SELECT * FROM states WHERE Ranking < ?", 10);
````

Later on those parameters can be changed:
````Javascript
multdb.view("states").setParameters(5);
````

If necessary, the view SQL can be changed:
````Javascript
multdb.view("states").sql = "SELECT * FROM states WHERE State LIKE ?";
````

The [connection object](https://github.com/mlaanderson/database-js/wiki/API-Connection) for each view can also be accessed:
````Javascript
var sqliteConnection = multdb.view("states").connection;
...
````

### Share Connections
It is best practice to share the connection for views on the same database. If you
want to use multiple tables from one database and multiple from a second database,
reuse the connection object for each one.

You can create the connection objects seperately:
````Javascript
var connPG = new Connection('postgres://user:password@pghost/db1');
var connMS = new Connection('mysql://user:password@mshost/db2');
var multdb = new MultipleDatabase();

multdb.add('pgTable1', connPG, 'SELECT ...');
multdb.add('pgTable2', connPG, 'SELECT ...');
multdb.add('msTable1', connMS, 'SELECT ...');
multdb.add('msTable2', connMS, 'SELECT ...');
````

Or you can let the database-js-multiple object handle it for you:
````Javascript
var multdb = new MultipleDatabase();
multdb.add('pgTable1', 'postgres://user:password@pghost/db1', 'SELECT ...');
multdb.add('pgTable2', multdb.view('pgTable1').connection, 'SELECT ...');
multdb.add('msTable1', 'mysql://user:password@mshost/db2', 'SELECT ...');
multdb.add('msTable2', multdb.view('msTable1').connection, 'SELECT ...');
````
