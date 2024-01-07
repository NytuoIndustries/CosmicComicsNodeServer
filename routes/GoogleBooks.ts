const express = require('express');
const router = express.Router();


router.get("/insert/googlebooks/book/", apiGoogleLimiter, async function (req, res) {
    let token = req.headers.token;
    let realname = req.headers.name;
    let path = req.headers.path;
    GETGOOGLEAPI_book(realname).then(async function (cdata) {
        res.send(cdata);
        console.log(cdata);
        if (cdata === undefined) {
            throw new Error("no data");
        }
        if (cdata["totalItems"] > 0) {
            cdata = cdata["items"][0];
            await insertIntoDB("", `('${cdata["id"] + "_4"}','${4}','${realname}',null,${0},${0},${1},${0},${0},${0},'${path}','${cdata["volumeInfo"]["imageLinks"] !== undefined ? (cdata["volumeInfo"]["imageLinks"]["large"] !== undefined ? (cdata["volumeInfo"]["imageLinks"]["large"]) : (cdata["volumeInfo"]["imageLinks"]["thumbnail"])) : null}','${null}','${cdata["volumeInfo"]["description"] !== undefined ? cdata["volumeInfo"]["description"].replaceAll("'", "''") : null}','${cdata["volumeInfo"]["printType"]}',${cdata["volumeInfo"]["pageCount"]},'${JSON.stringify(cdata["volumeInfo"]["infoLink"])}','${null}','${JSON.stringify(cdata["volumeInfo"]["authors"])}','${null}','${cdata["saleInfo"]["retailPrice"] !== undefined ? (JSON.stringify(cdata["saleInfo"]["retailPrice"]["amount"])) : null}','${JSON.stringify(cdata["volumeInfo"]["publishedDate"])}','${null}','${null}','${null}',false)`, token, "Books")
            let authorsccdata = cdata["volumeInfo"]["authors"];
            for (let i = 0; i < authorsccdata.length; i++) {
                await insertIntoDB("", `('${cdata["id"] + "_4"}','${authorsccdata[i].replaceAll("'", "''")}','${null}',${null},'${null}')`, token, "Creators")
            }
        } else {
            await insertIntoDB("", `('${Math.floor(Math.random() * 100000) + "_4"}','${4}','${realname}',null,${0},${0},${1},${0},${0},${0},'${path}','${null}','${null}','${null}','${null}',${null},'${null}','${null}','${null}','${null}','${null}','${null}','${null}','${null}','${null}',false)`, token, "Books")
        }
    })
})
router.get("/api/googlebooks/getComics/:name", apiGoogleLimiter, async function (req, res) {
    let name = decodeURIComponent(req.params.name);
    GETGOOGLEAPI_book(name).then(function (data) {
        res.send(data);
    })
})
module.exports = router;