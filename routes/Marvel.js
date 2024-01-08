const express = require("express");
var RateLimit = require('express-rate-limit');
let router = express.Router();
var apiMarvelLimiter = RateLimit({
    //for a day
    windowMs: 1 * 60 * 1000 * 60 * 24,
    max: 3000
});
const { API_MARVEL_GET, GETMARVELAPI_Creators, GETMARVELAPI_Characters, GETMARVELAPI_variants, GETMARVELAPI_relations, GETMARVELAPI_SEARCH, GETMARVELAPI_Comics } = require("../api/Marvel");
const { insertIntoDB } = require("../utils/Database");
router.post("/api/marvel", apiMarvelLimiter, async (req, res) => {
    let token = req.body.token;
    let name = req.body.name;
    let path = req.body.path;
    await API_MARVEL_GET(name).then(async function (data) {
        let randID = Math.floor(Math.random() * 1000000);
        console.log(data);
        console.log(name);
        if (data["data"]["total"] === 0) {
            await insertIntoDB("(ID_Series,title,note,start_date,end_date,description,Score,cover,BG,CHARACTERS,STAFF,SOURCE,volumes,chapters,favorite,PATH,lock)", "('" + randID + "U_1" + "','" + JSON.stringify(name.replaceAll("'", "''")) + "',null,null,null,null,'0',null,null,null,null,null,null,null,0,'" + path + "',false)", token, "Series");
        } else {
            await insertIntoDB("(ID_Series,title,note,start_date,end_date,description,Score,cover,BG,CHARACTERS,STAFF,SOURCE,volumes,chapters,favorite,PATH,lock)", "('" + data["data"]["results"][0]["id"] + "_1" + "','" + JSON.stringify(data["data"]["results"][0]["title"]).replaceAll("'", "''") + "',null,'" + JSON.stringify(data["data"]["results"][0]["startYear"]).replaceAll("'", "''") + "','" + JSON.stringify(data["data"]["results"][0]["endYear"]).replaceAll("'", "''") + "','" + data["data"]["results"][0]["description"] + "','" + data["data"]["results"][0]["rating"] + "','" + JSON.stringify(data["data"]["results"][0]["thumbnail"]) + "','" + JSON.stringify(data["data"]["results"][0]["thumbnail"]) + "','" + JSON.stringify(data["data"]["results"][0]["characters"]).replaceAll("'", "''") + "','" + JSON.stringify(data["data"]["results"][0]["creators"]).replaceAll("'", "''") + "','" + JSON.stringify(data["data"]["results"][0]["urls"][0]) + "','" + JSON.stringify(data["data"]["results"][0]["comics"]["items"]) + "','" + data["data"]["results"][0]["comics"]["available"] + "',0,'" + path + "',false)", token, "Series");
            await GETMARVELAPI_Creators(data["data"]["results"][0]["id"], "series").then(async (ccdata) => {
                ccdata = ccdata["data"]["results"];
                for (let i = 0; i < ccdata.length; i++) {
                    await insertIntoDB("", `('${ccdata[i]["id"] + "_1"}','${ccdata[i]["fullName"].replaceAll("'", "''")}','${JSON.stringify(ccdata[i]["thumbnail"])}',${null},'${JSON.stringify(ccdata[i]["urls"])}')`, token, "Creators");
                }
            }).catch((err) => {
                console.log(err);
            });
            await GETMARVELAPI_Characters(data["data"]["results"][0]["id"], "series").then(async (ccdata) => {
                ccdata = ccdata["data"]["results"];
                for (let i = 0; i < ccdata.length; i++) {
                    await insertIntoDB("", `('${ccdata[i]["id"] + "_1"}','${ccdata[i]["name"].replaceAll("'", "''")}','${JSON.stringify(ccdata[i]["thumbnail"])}','${ccdata[i]["description"].replaceAll("'", "''")}','${JSON.stringify(ccdata[i]["urls"])}')`, token, "Characters");
                }
            }).catch((err) => {
                console.log(err);
            });
            /*  await GETMARVELAPI_variants(data["data"]["results"][0]["id"]).then(async (cvdata) => {
                  cvdata = cvdata["data"]["results"];
                  for (let i = 0; i < cvdata.length; i++) {
                          await insertIntoDB("variants", "", `('${cvdata[i]["id"] + "_1"}','${cvdata[i]["title"].replaceAll("'", "''")}','${JSON.stringify(cvdata[i]["thumbnail"])}','${null}','${JSON.stringify(cvdata[i]["urls"])}','${data["data"]["results"][0]["id"] + "_1"}')`).then(() => {
                              console.log("inserted");
                          });
                  }
              })*/
            await GETMARVELAPI_relations(data["data"]["results"][0]["id"]).then(async (cvdata) => {
                cvdata = cvdata["data"]["results"];
                for (let i = 0; i < cvdata.length; i++) {
                    if (cvdata[i]["description"] == null) {
                        await insertIntoDB("", `('${cvdata[i]["id"] + "_1"}','${cvdata[i]["title"].replaceAll("'", "''")}','${JSON.stringify(cvdata[i]["thumbnail"])}','${null}','${JSON.stringify(cvdata[i]["urls"])}','${data["data"]["results"][0]["id"] + "_1"}')`, token, "relations");
                    } else {
                        await insertIntoDB("", `('${cvdata[i]["id"] + "_1"}','${cvdata[i]["title"].replaceAll("'", "''")}','${JSON.stringify(cvdata[i]["thumbnail"])}','${cvdata[i]["description"].replaceAll("'", "''")}','${JSON.stringify(cvdata[i]["urls"])}','${data["data"]["results"][0]["id"] + "_1"}')`, token, "relations");
                    }
                }
            }).catch((err) => {
                console.log(err);
            });
        }
    }).catch((err) => {
        console.log(err);
    });
    res.sendStatus(200);
});

router.get("/api/marvel/searchonly/:name/", apiMarvelLimiter, async (req, res) => {
    GETMARVELAPI_SEARCH(req.params.name).then(function (data) {
        res.send(data);
    });
});
router.get("/api/marvel/searchonly/:name/:date", apiMarvelLimiter, async (req, res) => {
    GETMARVELAPI_SEARCH(req.params.name, req.params.date).then(function (data) {
        res.send(data);
    });
});
router.get("/insert/marvel/book/", apiMarvelLimiter, async function (req, res) {
    let token = req.headers.token;
    let realname = req.headers.name;
    let date = req.headers.datea;
    let path = req.headers.path;
    GETMARVELAPI_Comics(realname, date).then(async function (cdata) {
        res.send(cdata);
        console.log(cdata);
        if (cdata === undefined) {
            throw new Error("no data");
        }
        if (cdata["data"]["total"] > 0) {
            cdata = cdata["data"]["results"][0];
            await insertIntoDB("", `('${cdata["id"] + "_1"}','1','${realname}',null,${0},${0},${1},${0},${0},${0},'${path}','${cdata["thumbnail"].path + "/detail." + cdata["thumbnail"].extension}','${cdata["issueNumber"]}','${cdata["description"] !== null ? cdata["description"].replaceAll("'", "''") : ""}','${cdata["format"]}',${cdata["pageCount"]},'${JSON.stringify(cdata["urls"])}','${JSON.stringify(cdata["series"])}','${JSON.stringify(cdata["creators"])}','${JSON.stringify(cdata["characters"])}','${JSON.stringify(cdata["prices"])}','${JSON.stringify(cdata["dates"])}','${JSON.stringify(cdata["collectedIssues"])}','${JSON.stringify(cdata["collections"])}','${JSON.stringify(cdata["variants"])}',false)`, token, "Books");
            GETMARVELAPI_Creators(cdata["id"], "comics").then(async (ccdata) => {
                ccdata = ccdata["data"]["results"];
                for (let i = 0; i < ccdata.length; i++) {
                    await insertIntoDB("", `('${ccdata[i]["id"] + "_1"}','${ccdata[i]["fullName"].replaceAll("'", "''")}','${JSON.stringify(ccdata[i]["thumbnail"])}',${null},'${JSON.stringify(ccdata[i]["urls"])}')`, token, "Creators");
                }
            });
            GETMARVELAPI_Characters(cdata["id"], "comics").then(async (ccdata) => {
                ccdata = ccdata["data"]["results"];
                for (let i = 0; i < ccdata.length; i++) {
                    await insertIntoDB("", `('${ccdata[i]["id"] + "_1"}','${ccdata[i]["name"].replaceAll("'", "''")}','${JSON.stringify(ccdata[i]["thumbnail"])}','${ccdata[i]["description"].replaceAll("'", "''")}','${JSON.stringify(ccdata[i]["urls"])}')`, token, "Characters");
                }
            });
        } else {
            await insertIntoDB("", `('${Math.floor(Math.random() * 100000) + "_1"}','${1}','${realname}',null,${0},${0},${1},${0},${0},${0},'${path}','${null}','${null}','${null}','${null}',${null},'${null}','${null}','${null}','${null}','${null}','${null}','${null}','${null}','${null}',false)`, token, "Books");
        }
    });
});

router.get("/api/marvel/getComics/:name/:date", apiMarvelLimiter, async function (req, res) {
    let name = decodeURIComponent(req.params.name);
    let date = decodeURIComponent(req.params.date);
    GETMARVELAPI_Comics(name, date).then(function (data) {
        res.send(data);
    });
});

module.exports = router;