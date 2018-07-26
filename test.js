const MultipleDriver = require('.');
const { Connection } = require('database-js');

(async () => {
    let mdb = new MultipleDriver();
    mdb.addView("table1", "postgres://user:password@machine/db", "SELECT * FROM table1");
    mdb.addView("table2", "localstorage:///test", "SELECT * FROM table2");

    let conn = new Connection("multiple:///anything", mdb);

    let stmt = conn.prepareStatement("SELECT table1.name, table1.age, table2.nickname FROM table1 INNER JOIN table2 ON table1.name = table2.name");
    let rows = await stmt.query();

    console.log(rows);

    await conn.close();
})();