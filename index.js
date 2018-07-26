const { Connection } = require('database-js');
const AbstractDriver = require('database-js-sqlparser');

class MultipleDriver extends AbstractDriver {
    constructor() {
        super();
        this.__views = {};
    }

    /**
     * Adds a view definition
     * @param {string} name The view name or alias
     * @param {string|Connection} url The database connection or connection URL
     * @param {string} definition The view definition
     */
    addView(name, url, definition, ...parameters) {
        if (this.__views[name]) {
            throw `${name} is already defined as a view`;
        }

        let conn;

        if (Connection.prototype.isPrototypeOf(url)) {
            conn = url;
        } else {
            conn = new Connection(url.toString());
        }

        this.__views[name] = {
            name: name,
            connection: conn,
            definition: conn.prepareStatement(definition),
            parameters: parameters
        };
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
            if (!this.__views[table]) {
                return reject(`The view "${table}" does not exist`);
            }
            resolve(this.__views[table].definition.query(...this.__views[table].parameters));
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
            for (let view of Object.values(this.__views)) {
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

