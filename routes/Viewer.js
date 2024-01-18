const express = require("express");
let router = express.Router();
const { CosmicComicsTemp } = require("../utils/GlobalVariable");
const { replaceHTMLAdressPath, resolveToken, GetListOfImg } = require("../utils/Utils");
const fs = require("fs");
router.get("/viewer/view/current/:token", (req, res) => {
    res.send(GetListOfImg(CosmicComicsTemp + "/profiles/" + resolveToken(req.params.token) + "/current_book/"));
});
router.get("/viewer/view", (req, res) => {
    console.log(req.headers.path);
    let param = replaceHTMLAdressPath(req.headers.path);
    let tosend = GetListOfImg(param);
    console.log(tosend);
    console.log(param);
    res.send(tosend);
});

router.get("/viewer/view/current/:page/:token", (req, res) => {
    const page = req.params.page;
    const listOfImg = GetListOfImg(CosmicComicsTemp + "/profiles/" + resolveToken(req.params.token) + "/current_book/");
    res.send(CosmicComicsTemp + "/profiles/" + resolveToken(req.params.token) + "/current_book/" + listOfImg[page]);
});
router.get("/view/isDir/:path", (req, res) => {
    const isDir = fs.statSync(replaceHTMLAdressPath(req.params.path)).isDirectory();
    res.send(isDir);
});
router.get("/view/exist/:path", (req, res) => {
    const exist = fs.existsSync(replaceHTMLAdressPath(req.params.path));
    console.log(exist);
    res.send(exist);
});
router.get("/view/readFile/:path", (req, res) => {
    const o = replaceHTMLAdressPath(req.params.path);
    const p = fs.readFileSync(o, "utf8");
    res.send(JSON.stringify(p));
});
router.get("/view/readImage", (req, res) => {
    if (req.headers.met === "DL") {
        res.sendFile(req.headers.path + "/" + req.headers.page);
    } else if (req.headers.met === "CLASSIC") {
        let token = resolveToken(req.headers.token);
        res.sendFile(CosmicComicsTemp + "/profiles/" + token + "/current_book/" + req.headers.page);
    }
});
module.exports = router;