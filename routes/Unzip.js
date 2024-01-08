const express = require("express");
let router = express.Router();
const CosmicComicsTemp = require("../server").CosmicComicsTemp;
const { replaceHTMLAdressPath, resolveToken } = require("../utils/Utils");
const path = require("path");
const { UnZip, getStatusProgress } = require("../utils/Unzipper");
var currentBookPath = "";
var SendToUnZip = "";
function SendTo(val) {
    console.log("sendto => " + val);
    SendToUnZip = val;
}
router.get("/getStatus/:token/:type", (req, res) => {
    res.send(getStatusProgress(req.params.token, req.params.type));
});

router.get("/Unzip/:path/:token", (req, res) => {
    const token = req.params.token;
    var currentPath = replaceHTMLAdressPath(req.params.path);
    currentBookPath = currentPath.split("&page=")[1];
    var patho = currentPath;
    var named = path.basename(patho);
    named = named.split(".");
    var ext = named.pop();
    UnZip(currentPath, CosmicComicsTemp + "/profiles/" + resolveToken(token) + "/current_book", "00000", ext, token);
    let inter = setInterval(() => {
        if (SendToUnZip !== "") {
            res.sendStatus(200);
            clearInterval(inter);
            return;
        }
    }, 1000);
});

module.exports = router;