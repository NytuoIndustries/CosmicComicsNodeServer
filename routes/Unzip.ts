const express = require('express');
const router = express.Router();


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