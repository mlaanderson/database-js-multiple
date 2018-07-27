const MultipleDatabase = require(".");

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