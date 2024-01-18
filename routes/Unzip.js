const express = require("express");
let router = express.Router();
const { CosmicComicsTemp } = require("../utils/GlobalVariable");
const { replaceHTMLAdressPath, resolveToken } = require("../utils/Utils");
const path = require("path");
const { UnZip, getStatusProgress } = require("../utils/Unzipper");
let currentBookPath = "";
const { SendToUnZip } = require("../utils/GlobalVariable");
router.get("/getStatus/:token/:type", (req, res) => {
    res.send(getStatusProgress(req.params.token, req.params.type));
});

router.get("/Unzip/:path/:token", (req, res) => {
    const token = req.params.token;
    const currentPath = replaceHTMLAdressPath(req.params.path);
    currentBookPath = currentPath.split("&page=")[1];
    const patho = currentPath;
    let named = path.basename(patho);
    named = named.split(".");
    const ext = named.pop();
    UnZip(currentPath, CosmicComicsTemp + "/profiles/" + resolveToken(token) + "/current_book", "00000", ext, token);
    let inter = setInterval(() => {
        if (SendToUnZip !== "") {
            res.sendStatus(200);
            clearInterval(inter);
        }
    }, 1000);
});

module.exports = {
    router,
    currentBookPath
}