const { CosmicComicsTemp } = require("./GlobalVariable");
let openedDB = new Map();
let sqlite3 = require("sqlite3");

function disableOpenedDB(userToken) {
    openedDB.delete(userToken);
}
function UpdateDB(type, column, value, token, table, where, whereEl) {
    if (type === "edit") {
        let listOfColumns = column;
        let listOfValues = value;
        let what = [];
        for (let i = 0; i < listOfColumns.length; i++) {
            if (listOfColumns[i] === "description") {
                what.push(listOfColumns[i] + " = '" + listOfValues[i].toString().replace(/'/g, "''").replace(/"/g, '\\"') + "'");
            } else {
                what.push(listOfColumns[i] + " = '" + listOfValues[i] + "'");
            }
        }
        console.log(what);
        try {
            getDB(resolveToken(token)).run("UPDATE " + table + " SET " + what.toString() + " WHERE " + where + "='" + whereEl + "';");
        } catch (e) {
            console.log(e);
        }
    } else {
        try {
            getDB(resolveToken(token)).run("UPDATE " + table + " SET " + column + " = " + value + " WHERE " + where + "='" + whereEl + "';");
        } catch (e) {
            console.log(e);
        }
    }
}

function insertIntoDB(into, val, tokenu, dbName) {
    try {
        const dbinfo = into;
        const values = val;
        const token = resolveToken(tokenu);
        console.log(dbinfo + values);
        getDB(token).run("INSERT OR IGNORE INTO " + dbName + " " + dbinfo + " VALUES " + values + ";");
    } catch (e) {
        console.log(e);
    }
}

function backupTable(user, tableName) {
    getDB(user).run("ALTER TABLE " + tableName + " RENAME TO " + tableName + "_old");
}

async function getAllColumns(user, tableName) {
    return await getDB(user).run("SELECT type,tbl_name FROM sqlite_master", (err, rows) => {
        if (err) {
            console.log(err);
        }
        return rows["tbl_name"][tableName];
    });
}

function makeDB(forwho) {
    let db = new sqlite3.Database(CosmicComicsTemp + '/profiles/' + forwho + '/CosmicComics.db', (err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log("Connected to the DB");
    });
    db.run('CREATE TABLE IF NOT EXISTS Books (ID_book VARCHAR(255) PRIMARY KEY NOT NULL, API_ID VARCHAR(255), NOM VARCHAR(255) NOT NULL,note INTEGER,read boolean NOT NULL,reading boolean NOT NULL,unread boolean NOT NULL,favorite boolean NOT NULL,last_page INTEGER NOT NULL,folder boolean NOT NULL,PATH VARCHAR(255) NOT NULL,URLCover VARCHAR(255), issueNumber INTEGER,description VARCHAR(255),format VARCHAR(255),pageCount INTEGER,URLs VARCHAR(255),series VARCHAR(255),creators VARCHAR(255),characters VARCHAR(255),prices VARCHAR(255),dates VARCHAR(255),collectedIssues VARCHAR(255),collections VARCHAR(255),variants VARCHAR(255),lock boolean DEFAULT false NOT NULL)');
    db.run("CREATE TABLE IF NOT EXISTS Bookmarks (ID_BOOKMARK INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,BOOK_ID VARCHAR(255) NOT NULL,PATH VARCHAR(4096) NOT NULL,page INTEGER NOT NULL,FOREIGN KEY (BOOK_ID) REFERENCES Book (ID_book));");
    db.run("CREATE TABLE IF NOT EXISTS API (ID_API INTEGER PRIMARY KEY NOT NULL, NOM VARCHAR(255) NOT NULL);", () => {
        db.run("REPLACE INTO API (ID_API,NOM) VALUES (1,'Marvel'), (2,'Anilist'),(4,'LeagueOfComicsGeeks'),(3,'OpenLibrary'),(0,'MANUAL')");
    });
    db.run("CREATE TABLE IF NOT EXISTS Series (ID_Series VARCHAR(255) PRIMARY KEY NOT NULL UNIQUE,title VARCHAR(255) NOT NULL,note INTEGER,statut VARCHAR(255),start_date VARCHAR(255),end_date VARCHAR(255),description VARCHAR(255),Score INTEGER,genres VARCHAR(255),cover VARCHAR(255),BG VARCHAR(255),CHARACTERS VARCHAR(255),TRENDING INTEGER,STAFF VARCHAR(255),SOURCE VARCHAR(255),volumes INTEGER,chapters INTEGER,favorite boolean NOT NULL,PATH VARCHAR(255) NOT NULL,lock boolean DEFAULT false NOT NULL );");
    db.run("CREATE TABLE IF NOT EXISTS Creators (ID_CREATOR VARCHAR(255) PRIMARY KEY NOT NULL UNIQUE,name VARCHAR(255),image varchar(255),description VARCHAR(255),url VARCHAR(255))");
    db.run("CREATE TABLE IF NOT EXISTS Characters (ID_CHAR VARCHAR(255) PRIMARY KEY NOT NULL UNIQUE,name VARCHAR(255),image varchar(255),description VARCHAR(255),url VARCHAR(255))");
    db.run("CREATE TABLE IF NOT EXISTS variants (ID_variant VARCHAR(255) PRIMARY KEY NOT NULL UNIQUE,name VARCHAR(255),image varchar(255),url VARCHAR(255),series VARCHAR(255), FOREIGN KEY (series) REFERENCES Series (ID_Series))");
    db.run("CREATE TABLE IF NOT EXISTS relations (ID_variant VARCHAR(255) PRIMARY KEY NOT NULL UNIQUE,name VARCHAR(255),image varchar(255),description VARCHAR(255),url VARCHAR(255),series VARCHAR(255), FOREIGN KEY (series) REFERENCES Series (ID_Series))");
    db.run("CREATE TABLE IF NOT EXISTS Libraries (ID_LIBRARY INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, NAME VARCHAR(255) NOT NULL,PATH VARCHAR(4096) NOT NULL,API_ID INTEGER NOT NULL,FOREIGN KEY (API_ID) REFERENCES API(ID_API));");
    db.run("PRAGMA user_version = " + process.env.npm_package_version?.split(".").join("") + ";");
    db.close();
}

async function checkForDBUpdate(forwho) {
    let DBVersion;
    await getDB(forwho).get("PRAGMA user_version", (err, row) => {
        DBVersion = row["user_version"];
        console.log(DBVersion);
        if (DBVersion < 20000) {
            console.log("Impossible to update the DB (you are using an old version of CosmicComics)");
        }
        if (DBVersion <= 20001) {
        }
        var pjson = require('../package.json');
        getDB(forwho).run("PRAGMA user_version = " + pjson.version?.split(".").join("") + ";");
    });
}

function getDB(forwho) {
    if (!openedDB.has(forwho)) {
        openedDB.set(forwho, new sqlite3.Database(CosmicComicsTemp + '/profiles/' + forwho + '/CosmicComics.db', (err) => {
            if (err) {
                return console.error(err.message);
            }
            checkForDBUpdate(forwho);
            console.log("Conected to the DB");
        }));
    }
    return openedDB.get(forwho);
}

module.exports = {
    getDB,
    makeDB,
    UpdateDB,
    insertIntoDB,
    backupTable,
    getAllColumns,
    disableOpenedDB
};