const express = require("express");
var RateLimit = require('express-rate-limit');
let router = express.Router();
var apiAnilistLimiter = RateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 90
});
const { API_ANILIST_GET, API_ANILIST_GET_SEARCH } = require("../api/Anilist");
const { insertIntoDB } = require("../utils/Database");
router.post("/api/anilist", apiAnilistLimiter, async (req, res) => {
    let name = req.headers.name;
    let token = req.headers.token;
    let path = req.headers.path;
    await API_ANILIST_GET(name).then(async function (thedata) {
        console.log(thedata);
        let randID = Math.floor(Math.random() * 1000000);
        if (thedata === null) {
            await insertIntoDB("(ID_Series,title,note,statut,start_date,end_date,description,Score,genres,cover,BG,CHARACTERS,TRENDING,STAFF,SOURCE,volumes,chapters,favorite,PATH,lock)", "('" + randID + "U_2" + "','" + JSON.stringify(name.replaceAll("'", "''")) + "',null,null,null,null,null,'0',null,null,null,null,null,null,null,null,null,0,'" + path + "',false)", token, "Series");
            return;
        }
        let data = thedata["base"];
        let relationsData = thedata["relations"];
        let charactersData = thedata["characters"];
        let staffData = thedata["staff"];
        console.log(staffData);
        await insertIntoDB("(ID_Series,title,note,statut,start_date,end_date,description,Score,genres,cover,BG,CHARACTERS,TRENDING,STAFF,SOURCE,volumes,chapters,favorite,PATH,lock)", "('" + data["id"] + "_2" + "','" + JSON.stringify(data["title"]).replaceAll("'", "''") + "',null,'" + data["status"].replaceAll("'", "''") + "','" + JSON.stringify(data["startDate"]).replaceAll("'", "''") + "','" + JSON.stringify(data["endDate"]).replaceAll("'", "''") + "','" + (data["description"] !== null ? data["description"].replaceAll("'", "''") : "") + "','" + data["meanScore"] + "','" + JSON.stringify(data["genres"]).replaceAll("'", "''") + "','" + data["coverImage"]["large"] + "','" + data["bannerImage"] + "','" + JSON.stringify(data["characters"]).replaceAll("'", "''") + "','" + data["trending"] + "','" + JSON.stringify(data["staff"]).replaceAll("'", "''") + "','" + data["siteUrl"].replaceAll("'", "''") + "','" + data["volumes"] + "','" + data["chapters"] + "',0,'" + path + "',false)", token, "Series");
        for (let i = 0; i < staffData.length; i++) {
            try {
                if (staffData[i]["description"] == null) {
                    await insertIntoDB("", `('${staffData[i]["id"] + "_2"}','${staffData[i]["name"]["full"].replaceAll("'", "''")}','${JSON.stringify(staffData[i]["image"]["medium"])}','${null}','${JSON.stringify(staffData[i]["siteUrl"])}')`, token, "Creators");
                } else {
                    await insertIntoDB("", `('${staffData[i]["id"] + "_2"}','${staffData[i]["name"]["full"].replaceAll("'", "''")}','${JSON.stringify(staffData[i]["image"]["medium"])}','${JSON.stringify(staffData[i]["description"].replaceAll("'", "''"))}','${JSON.stringify(staffData[i]["siteUrl"])}')`, token, "Creators");
                }
            } catch (e) {
                console.log(e);
            }
        }
        for (let i = 0; i < charactersData.length; i++) {
            try {
                if (charactersData[i]["description"] == null) {
                    await insertIntoDB("", `('${charactersData[i]["id"] + "_2"}','${charactersData[i]["name"]["full"].replaceAll("'", "''")}','${JSON.stringify(charactersData[i]["image"]["medium"])}','${null}','${JSON.stringify(charactersData[i]["siteUrl"])}')`, token, "Characters");
                } else {
                    await insertIntoDB("", `('${charactersData[i]["id"] + "_2"}','${charactersData[i]["name"]["full"].replaceAll("'", "''")}','${JSON.stringify(charactersData[i]["image"]["medium"])}','${JSON.stringify(charactersData[i]["description"].replaceAll("'", "''"))}','${JSON.stringify(charactersData[i]["siteUrl"])}')`, token, "Characters");
                }
            } catch (e) {
                console.log(e);
            }
        }
        for (let i = 0; i < relationsData.length; i++) {
            let dataR = relationsData[i];
            if (dataR.title.english == null) {
                await insertIntoDB("", `('${dataR["id"] + "_2"}','${dataR["title"]["romaji"].replaceAll("'", "''")}','${dataR["coverImage"]["large"]}','${dataR["type"] + " / " + dataR["relationType"] + " / " + dataR["format"]}',${null},'${data["id"] + "_2"}')`, token, "relations");
                console.log("inserted");
            } else {
                await insertIntoDB("", `('${dataR["id"] + "_2"}','${dataR["title"]["english"].replaceAll("'", "''")}','${dataR["coverImage"]["large"]}','${dataR["type"] + " / " + dataR["relationType"] + " / " + dataR["format"]}',${null},'${data["id"] + "_2"}')`, token, "relations");
                console.log("inserted");
            }
        }
    });
    res.sendStatus(200);
});

router.get("/api/anilist/searchOnly/:name", apiAnilistLimiter, (req, res) => {
    let name = req.params.name;
    API_ANILIST_GET_SEARCH(name).then(async function (dataa) {
        res.send(dataa);
    });
});


module.exports = router;