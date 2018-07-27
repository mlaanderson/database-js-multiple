const { Connection, PreparedStatement } = require('database-js');
const AbstractDriver = require('database-js-sqlparser');

var privates = new WeakMap();

class View {
    constructor(name, url, sql, ...parameters) {
        let conn;
        if (Connection.prototype.isPrototypeOf(url)) {
            conn = url;
        } else {
            conn = new Connection(url);
        }

        privates.set(this, {
            name: name,
            sql: sql,
            statement: conn.prepareStatement(sql),
            connection: conn
        });

        this.parameters = parameters;
    }

    /** @type {string} */
    get name() {
        return privates.get(this).name;
    }

    /**
     * @type {Connection}
     */
    get connection() {
        return privates.get(this).connection;
    }

    /** @type {string} */
    get sql() {
        return privates.get(this).sql;
    }
    set sql(sql) {
        privates.get(this).sql = sql;
        privates.get(this).statement = this.connection.prepareStatement(sql);
    }

    /** @type {PreparedStatement} */
    get statement() {
        return privates.get(this).statement
    }

    /**
     * Sets new parameters for the view
     * @param {Array<any>} parameters Parameters used to filter the view
     */
    setParameters(...parameters) {
        this.parameters = parameters;
    }
}

class MultipleDriver extends AbstractDriver {
    constructor() {
        super();
        privates.set(this, {
            views: {}, 
            connection: new Connection({}, this)
        });
    }

    /**
     * Adds a view definition
     * @param {string} name The view name or alias
     * @param {string|Connection} url The database connection or connection URL
     * @param {string} sql The SQL to generate the view
     */
    add(name, url, sql, ...parameters) {
        if (privates.get(this).views[name]) {
            throw `${name} is already defined as a view`;
        }

        privates.get(this).views[name] = new View(name, url, sql, ...parameters);
    }

    /**
     * Fetches a view by name or aliase
     * @param {string} name The view name or alias
     * @returns {View}
     */
    view(name) {
        if (!privates.get(this).views[name]) return null;
        return privates.get(this).views[name];
    }

    get connection() {
        return privates.get(this).connection;
    }

    /**
     * Opens the connection 
     * @param {object} connection The database connection object, ignored to allow for multiple views
     */
    open(connection) {
        return this;
    }

    /**
     * Loads all rows from this view
     * @param {string} table The view to load rows from
     */
    load(table) {
        return new Promise((resolve, reject) => {
            if (!privates.get(this).views[table]) {
                return reject(`The view "${table}" does not exist`);
            }
            resolve(privates.get(this).views[table].statement.query(...privates.get(this).views[table].parameters));
        });
    }

    store(table, index, row) {
        return Promise.reject("Views across multiple databases are read-only");
    }

    remove(table, index) {
        return Promise.reject("Views across multiple databases are read-only");
    }
    
    create(table, definition) {
        return Promise.reject("Views across multiple databases are read-only");
    }

    close() {
        return new Promise((resolve, reject) => {
            let promises = [];
            for (let view of Object.values(privates.get(this).views)) {
                promises.push(view.connection.close());
            }

            Promise.all(promises).then(() => resolve(true));
        });
    }

    ready() {
        return Promise.resolve(true);
    }
}

module.exports = MultipleDriver;

