const MultipleDriver = require('.');
const { Connection } = require('database-js');

(async () => {
    let mdb = new MultipleDriver();
    mdb.addView("states", "sqlite:///test.sqlite", "SELECT * FROM states");
    mdb.addView("abbr", "localstorage:///tests", "SELECT * FROM abbr");

    let conn = new Connection({}, mdb);

    let stmt = conn.prepareStatement("SELECT abbr.Abbr, states.Ranking, states.Population FROM states JOIN abbr ON states.State = abbr.State");
    let rows = await stmt.query();

    console.log(rows);

    await conn.close();

})();