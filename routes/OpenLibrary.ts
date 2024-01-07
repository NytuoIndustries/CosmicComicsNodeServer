const express = require('express');
const router = express.Router();


router.get("/insert/ol/book/", async function (req, res) {
    let token = req.headers.token;
    let realname = req.headers.name;
    let path = req.headers.path;
    GETOLAPI_search(realname).then(async function (cdata) {
        if (cdata === undefined) {
            throw new Error("no data");
        }
        if (cdata["num_found"] > 0) {
            let key = cdata["docs"][0];
            key = key["seed"][0];
            key = key.split("/")[2];
            console.log(key);
            await GETOLAPI_book(key).then(async (book) => {
                res.send(book);
                //get the first child of an object
                let firstChild = Object.keys(book)[0];
                book = book[firstChild];
                console.log(book);
                let bookD = book["details"];
                console.log(bookD);
                await insertIntoDB("", `('${book["bib_key"] + "_3"}','${3}','${realname}',null,${0},${0},${1},${0},${0},${0},'${path}','${book.hasOwnProperty("thumbnail_url") ? book["thumbnail_url"].replace("-S", "-L") : null}','${null}','${bookD["description"] !== undefined ? bookD["description"].replaceAll("'", "''") : null}','${bookD["physical_format"] !== undefined ? bookD["physical_format"] : null}',${bookD["number_of_pages"] !== undefined ? bookD["number_of_pages"] : null},'${bookD["info_url"] !== undefined ? JSON.stringify(bookD["info_url"]) : null}','${null}','${bookD["authors"] !== undefined ? JSON.stringify(bookD["authors"]) : null}','${null}','${null}','${bookD["publish_date"] !== undefined ? JSON.stringify(bookD["publish_date"]) : null}','${null}','${null}','${null}',false)`, token, "Books")
                let bookauthors = bookD["authors"];
                for (let i = 0; i < bookauthors.length; i++) {
                    await insertIntoDB("", `('${bookauthors[i]["key"] + "_3"}','${bookauthors[i]["name"].replaceAll("'", "''")}','${null}',${null},'${null}')`, token, "Creators")
                }

            })
        } else {
            res.send(cdata)
            await insertIntoDB("", `('${Math.floor(Math.random() * 100000) + "_3"}','${3}','${realname}',null,${0},${0},${1},${0},${0},${0},'${path}','${null}','${null}','${null}','${null}',${null},'${null}','${null}','${null}','${null}','${null}','${null}','${null}','${null}','${null}',false)`, token, "Books")
        }
    })
})
router.get("/api/ol/getComics/:name", async function (req, res) {
    let name = decodeURIComponent(req.params.name);
    GETOLAPI_search(name).then(function (data) {
        res.send(data);
    })
})
module.exports = router;