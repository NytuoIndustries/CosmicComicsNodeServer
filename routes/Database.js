const express = require("express");
let router = express.Router();
const CosmicComicsTemp = require("../server").CosmicComicsTemp;
const { UpdateDB, getDB } = require("../utils/Database");
const { resolveToken } = require("../utils/Utils");
const { GETMARVELAPI_Comics_ByID, GETMARVELAPI_Series_ByID } = require("../api/Marvel");
const { GETOLAPI_Comics_ByID, GETOLAPI_search } = require("../api/OpenLibrary");
const anilist = require("anilist-node");
const AniList = new anilist();
const { GETGBAPI_Comics_ByID } = require("../api/GoogleBooks");
router.get("/DB/update/:token/:dbName/:colName/:value/:id", (req, res) => {
    try {
        getDB(resolveToken(req.params.token)).run("UPDATE " + req.params.dbName + " SET " + req.params.colName + " = " + req.params.value + " WHERE ID_book='" + req.params.id + "';");
    } catch (e) {
        console.log(e);
    }
    res.sendStatus(200);
});
router.post("/DB/update/OneForAll", (req, res) => {
    let token = resolveToken(req.body.token);
    let W1 = req.body.W1;
    let W2 = req.body.W2;
    let A = req.body.A;
    let title = req.body.title;
    console.log(W1, W2, A, title);
    try {
        getDB(token).all("SELECT * FROM Books WHERE " + W1 + "=1 OR " + W2 + "=1" + ";", function (err, resD) {
            if (err) return console.log("Error getting element", err);
            console.log(resD);
            let bookList = resD;
            console.log(bookList);
            for (let i = 0; i < bookList.length; i++) {
                if (bookList[i].PATH.toLowerCase().includes(JSON.parse(title)["english"].toLowerCase().replaceAll('"', ''))) {
                    let asso = {};
                    asso[A] = 1;
                    asso[W1] = 0;
                    asso[W2] = 0;
                    let columns = [];
                    let values = [];
                    for (let key in asso) {
                        columns.push(key);
                        values.push(asso[key]);
                    }
                    console.log(columns);
                    console.log(values);
                    UpdateDB("edit", columns, values, req.body.token, "Books", "PATH", bookList[i].PATH);
                }
            }
        });
    } catch (e) {
        console.log(e);
    }
    res.sendStatus(200);
});



router.post("/DB/update/", (req, res) => {
    UpdateDB(req.body.type, req.body.column, req.body.value, req.body.token, req.body.table, req.body.where, req.body.whereEl);
    res.sendStatus(200);
});
router.post("/DB/lib/update/:token/:id", (req, res) => {
    console.log(req.body);
    const name = req.body.name;
    const path = req.body.path;
    const api = req.body.api_id;
    const token = resolveToken(req.params.token);
    console.log(name, path, api);
    console.log("UPDATE Libraries SET NAME='" + name + "', PATH='" + path + "', API_ID=" + api + " WHERE ID_LIBRARY=" + req.params.id + ";");
    try {
        getDB(token).run("UPDATE Libraries SET NAME='" + name + "', PATH='" + path + "', API_ID=" + api + " WHERE ID_LIBRARY=" + req.params.id + ";");
    } catch (e) {
        console.log(e);
    }
    res.sendStatus(200);
});



router.post("/DB/insert/:token/:dbName", (req, res) => {
    try {
        const dbinfo = req.body.into;
        const values = req.body.val;
        const token = resolveToken(req.params.token);
        console.log(dbinfo + values);
        getDB(token).run("INSERT OR IGNORE INTO " + req.params.dbName + " " + dbinfo + " VALUES " + values + ";");
    } catch (e) {
        console.log(e);
    }
    res.sendStatus(200);
});
router.get("/DB/delete/:token/:dbName/:id/:option", (req, res) => {
    try {
        const token = resolveToken(req.params.token);
        getDB(token).run("DELETE FROM " + req.params.dbName + " WHERE BOOK_ID='" + req.params.id + "' " + req.params.option + ";");
    } catch (e) {
        console.log(e);
    }
    res.sendStatus(200);
});
router.get("/DB/truedelete/:token/:dbName/:id", (req, res) => {
    try {
        const token = resolveToken(req.params.token);
        getDB(token).run("DELETE FROM " + req.params.dbName + " WHERE ID_book='" + req.params.id + "';");
    } catch (e) {
        console.log(e);
    }
    res.sendStatus(200);
});
router.get("/DB/lib/delete/:token/:id", (req, res) => {
    try {
        const token = resolveToken(req.params.token);
        getDB(token).run("DELETE FROM Libraries WHERE ID_LIBRARY=" + req.params.id + ";");
    } catch (e) {
        console.log(e);
    }
    res.sendStatus(200);
});
router.post("/DB/get/:token/:dbName", (req, res) => {
    try {
        var result = [];
        const token = resolveToken(req.params.token);
        const requestToDB = req.body.request;
        getDB(token).all("SELECT " + requestToDB + ";", function (err, resD) {
            if (err) return console.log("Error getting element", err);
            resD.forEach((row) => {
                result.push(row);
            });
            res.send(result);
        });
    } catch (e) {
        console.log(e);
    }
});

router.post('/DB/write/:jsonFile', (req, res) => {
    fs.writeFileSync(CosmicComicsTemp + "/" + req.params.jsonFile + ".json", JSON.stringify(req.body, null, 2));
    res.sendStatus(200);
});
router.get("/DB/read/:jsonFile", (req, res) => {
    res.send(fs.readFileSync(CosmicComicsTemp + "/" + req.params.jsonFile + ".json"));
});

/**
 * Get from the Marvel API the list of comics
 * @param {string} id - The id of the comic
 * @return {string} The list of comics
 */
router.post("/refreshMeta", async function (req, res) {
    let id = req.body.id;
    let type = req.body.type;
    let provider = req.body.provider;
    let token = req.body.token;
    console.log(id);
    console.log(type);
    console.log(provider);

    if (provider === 1) {
        if (type === "book") {
            getDB(resolveToken(token)).all("SELECT * FROM Books WHERE ID_book=" + id + ";", async function (err, resD) {
                let result = [];
                if (err) return console.log("Error getting element", err);
                resD.forEach((row) => {
                    result.push(row);
                });
                let book = result[0];
                const BOOK_API_ID = book.ID_book.split("_")[0];
                await GETMARVELAPI_Comics_ByID(BOOK_API_ID).then(async (res2) => {
                    res2 = res2.data.results[0];
                    let blacklisted = ["note", "read", "reading", "unread", "favorite", "last_page", "folder", "PATH", "lock", "ID_book"];
                    let asso = {};
                    for (let i = 0; i < book.length; i++) {
                        for (let key in book[i]) {
                            if (!blacklisted.includes(key)) {
                                asso[key] = book[i][key];
                            }
                        }
                    }
                    asso["NOM"] = res2.title;
                    asso["URLCover"] = res2.thumbnail.path + "/detail." + res2.thumbnail.extension;
                    asso["issueNumber"] = res2.issueNumber;
                    asso["description"] = res2.description.replaceAll("'", "''");
                    asso["format"] = res2.format;
                    asso["pageCount"] = res2.pageCount;
                    asso["URLs"] = JSON.stringify(res2.urls);
                    asso["dates"] = JSON.stringify(res2.dates);
                    asso["prices"] = JSON.stringify(res2.prices);
                    asso["creators"] = JSON.stringify(res2.creators);
                    asso["characters"] = JSON.stringify(res2.characters);
                    asso["series"] = JSON.stringify(res2.series);
                    asso["collectedIssues"] = JSON.stringify(res2.collectedIssues);
                    asso["variants"] = JSON.stringify(res2.variants);
                    asso["collections"] = JSON.stringify(res2.collections);
                    asso["API_ID"] = provider;
                    let columns = [];
                    let values = [];
                    for (let key in asso) {
                        columns.push(key);
                        values.push(asso[key]);
                    }
                    UpdateDB("edit", columns, values, token, "Books", "PATH", book.PATH);
                });
            });
        } else {
            getDB(resolveToken(token)).all("SELECT * FROM Series WHERE ID_Series='" + id + "';", async function (err, resD) {
                let result = [];
                if (err) return console.log("Error getting element", err);
                resD.forEach((row) => {
                    result.push(row);
                });
                let book = result[0];
                console.log(book);
                await GETMARVELAPI_Series_ByID(parseInt(id)).then(async (res2) => {
                    if (!res2.hasOwnProperty("data")) {
                        return;
                    }
                    res2 = res2.data.results[0];
                    let blacklisted = ["note", "favorite", "PATH", "lock", "ID_Series"];
                    let asso = {};
                    for (let i = 0; i < book.length; i++) {
                        for (let key in book[i]) {
                            if (!blacklisted.includes(key)) {
                                asso[key] = book[i][key];
                            }
                        }
                    }
                    asso["title"] = JSON.stringify(res2.title).replaceAll("'", "''");
                    asso["cover"] = JSON.stringify(res2.thumbnail);
                    if (res2.description != null) {
                        asso["description"] = res2.description.replaceAll("'", "''");
                    } else {
                        asso["description"] = "";
                    }
                    asso["start_date"] = res2.startYear;
                    asso["end_date"] = res2.endYear;
                    asso["CHARACTERS"] = JSON.stringify(res2.characters).replaceAll("'", "''");
                    asso["STAFF"] = JSON.stringify(res2.creators).replaceAll("'", "''");
                    asso["SOURCE"] = JSON.stringify(res2.urls[0]);
                    asso["BG"] = JSON.stringify(res2.thumbnail);
                    asso["volumes"] = JSON.stringify(res2.comics.items).replaceAll("'", "''");
                    asso["chapters"] = JSON.stringify(res2.comics.available).replaceAll("'", "''");
                    asso["API_ID"] = provider;
                    let columns = [];
                    let values = [];
                    for (let key in asso) {
                        columns.push(key);
                        values.push(asso[key]);
                    }
                    UpdateDB("edit", columns, values, token, "Series", "PATH", book.PATH);
                });
            });
        }
    } else if (provider === 2) {
        if (type !== "book") {
            getDB(resolveToken(token)).all("SELECT * FROM Series WHERE ID_Series='" + id + "';", async function (err, resD) {
                let result = [];
                if (err) return console.log("Error getting element", err);
                resD.forEach((row) => {
                    result.push(row);
                });
                let book = result[0];
                await AniList.media.manga(parseInt(id)).then(function (res2) {
                    let blacklisted = ["note", "favorite", "PATH", "lock", "ID_Series"];
                    let asso = {};
                    for (let i = 0; i < book.length; i++) {
                        for (let key in book[i]) {
                            if (!blacklisted.includes(key)) {
                                asso[key] = book[i][key];
                            }
                        }
                    }
                    asso["title"] = JSON.stringify(res2.title).replaceAll("'", "''");
                    asso["cover"] = res2.coverImage.large;
                    if (res2.description != null) {
                        asso["description"] = res2.description.replaceAll("'", "''");
                    } else {
                        asso["description"] = "";
                    }
                    asso["start_date"] = JSON.stringify(res2.startDate).replaceAll("'", "''");
                    asso["end_date"] = JSON.stringify(res2.endDate).replaceAll("'", "''");
                    asso["CHARACTERS"] = JSON.stringify(res2.characters).replaceAll("'", "''");
                    asso["STAFF"] = JSON.stringify(res2.staff).replaceAll("'", "''");
                    asso["SOURCE"] = JSON.stringify(res2.siteUrl).replaceAll("'", "''");
                    asso["BG"] = res2.bannerImage;
                    asso["volumes"] = JSON.stringify(res2.volumes).replaceAll("'", "''");
                    asso["chapters"] = JSON.stringify(res2.chapters).replaceAll("'", "''");
                    asso["statut"] = res2["status"].replaceAll("'", "''");
                    asso["Score"] = res2["meanScore"];
                    asso["genres"] = JSON.stringify(res2["genres"]).replaceAll("'", "''");
                    asso["TRENDING"] = JSON.stringify(res2["trending"]).replaceAll("'", "''");
                    let columns = [];
                    let values = [];
                    for (let key in asso) {
                        columns.push(key);
                        values.push(asso[key]);
                    }
                    UpdateDB("edit", columns, values, token, "Series", "PATH", book.PATH);
                });
            });
        }
    } else if (provider === 3) {
        getDB(resolveToken(token)).all("SELECT * FROM Books WHERE ID_book='" + id + "';", async function (err, resD) {
            let result = [];
            if (err) return console.log("Error getting element", err);
            resD.forEach((row) => {
                result.push(row);
            });
            let book = result[0];
            await GETOLAPI_Comics_ByID(id).then(async (res2) => {
                let firstChild = Object.keys(res2)[0];
                res2 = res2[firstChild];
                console.log(res2);
                let blacklisted = ["note", "read", "reading", "unread", "favorite", "last_page", "folder", "PATH", "lock", "ID_book", "API_ID"];
                let asso = {};
                for (let i = 0; i < book.length; i++) {
                    for (let key in book[i]) {
                        if (!blacklisted.includes(key)) {
                            asso[key] = book[i][key];
                        }
                    }
                }
                let coverOL;
                await GETOLAPI_search(res2.details.title).then(function (data) {
                    coverOL = "https://covers.openlibrary.org/b/id/" + data["docs"][0]["cover_i"] + "-L.jpg";
                });
                asso["NOM"] = res2.details.title;
                if (res2.thumbnail_url) {
                    asso["URLCover"] = res2.thumbnail_url.replace("-S", "-L");
                } else {
                    asso["URLCover"] = coverOL;
                }
                asso["API_ID"] = provider;
                asso["issueNumber"] = "null";
                asso["description"] = res2.details.description !== undefined ? res2.details.description.replaceAll("'", "''") : "null";
                asso["format"] = res2.details.physical_format;
                asso["pageCount"] = JSON.stringify(res2.details.number_of_pages);
                asso["URLs"] = JSON.stringify(res2.details.info_url);
                asso["dates"] = JSON.stringify(res2.details.publish_date);
                asso["prices"] = "null";
                asso["creators"] = JSON.stringify(res2.details.authors);
                asso["characters"] = "null";
                asso["series"] = "null";
                asso["collectedIssues"] = "null";
                asso["variants"] = "null";
                asso["collections"] = "null";
                let columns = [];
                let values = [];
                for (let key in asso) {
                    columns.push(key);
                    values.push(asso[key]);
                }
                console.log(columns, values);
                UpdateDB("edit", columns, values, token, "Books", "PATH", book.PATH);
            });
        });
    } else if (provider === 4) {
        getDB(resolveToken(token)).all("SELECT * FROM Books WHERE ID_book=" + id + ";", async function (err, resD) {
            let result = [];
            if (err) return console.log("Error getting element", err);
            resD.forEach((row) => {
                result.push(row);
            });
            let book = result[0];
            await GETGBAPI_Comics_ByID(id).then(async (res2) => {
                res2 = res2[0];
                let blacklisted = ["note", "read", "reading", "unread", "favorite", "last_page", "folder", "PATH", "lock", "ID_book"];
                let asso = {};
                for (let i = 0; i < book.length; i++) {
                    for (let key in book[i]) {
                        if (!blacklisted.includes(key)) {
                            asso[key] = book[i][key];
                        }
                    }
                }
                let price;
                if (res2["saleInfo"]["retailPrice"] !== undefined) {
                    price = res2["saleInfo"]["retailPrice"]["amount"];
                } else {
                    price = null;
                }
                let cover;
                if (res2["volumeInfo"]["imageLinks"] !== undefined) {

                    cover = res2["volumeInfo"]["imageLinks"];
                    if (cover["large"] !== undefined) {
                        cover = cover["large"];
                    } else if (cover["thumbnail"] !== undefined) {
                        cover = cover["thumbnail"];
                    } else {
                        cover = null;
                    }
                } else {
                    cover = null;
                }
                asso["NOM"] = res2.volumeInfo.title;
                asso["API_ID"] = provider;
                asso["URLCover"] = cover;
                asso["issueNumber"] = "null";
                asso["description"] = res2.volumeInfo.description.replaceAll("'", "''");
                asso["format"] = res2.volumeInfo.printType;
                asso["pageCount"] = res2.volumeInfo.pageCount;
                asso["URLs"] = JSON.stringify(res2.volumeInfo.infoLink);
                asso["dates"] = JSON.stringify(res2.volumeInfo.publishedDate);
                asso["prices"] = JSON.stringify(res2.price);
                asso["creators"] = JSON.stringify(res2.volumeInfo.authors);
                asso["characters"] = "null";
                asso["series"] = "null";
                asso["collectedIssues"] = "null";
                asso["variants"] = "null";
                asso["collections"] = "null";
                let columns = [];
                let values = [];
                for (let key in asso) {
                    columns.push(key);
                    values.push(asso[key]);
                }
                UpdateDB("edit", columns, values, token, "Books", "PATH", book.PATH);
            });
        });
    }
    res.sendStatus(200);
});

module.exports = router;