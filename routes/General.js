const express = require("express");
let router = express.Router();
router.get('/getVersion', (_req, res) => {
    res.send(process.env.npm_package_version);
});
const { getColor, getPalette } = require('color-extr-thief');
const fs = require("fs");
const SevenBin = require("7zip-bin");
const Seven = require("node-7z");
const Path27Zip = SevenBin.path7za;
const { spawn } = require('child_process');
const { replaceHTMLAdressPath, resolveToken, fillBlankImages } = require("../utils/Utils");
const { root, CosmicComicsTemp } = require("../server");
const { getDB } = require("../utils/Database");
const tinycolor = require("tinycolor2");

let DLBOOKPATH = "";
router.get("/getListOfFolder/:path", (req, res) => {
    var dir = req.params.path;
    dir = replaceHTMLAdressPath(dir);
    var listOfFolder = [];
    if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(function (file) {
            file = dir + "/" + file;
            var stat = fs.statSync(file);
            if (stat.isDirectory()) {
                listOfFolder.push(file);
            } else {
            }
        });
    }
    res.send(listOfFolder);
});

router.get("/getListOfFilesAndFolders/:path", (req, res) => {
    var dir = req.params.path;
    dir = replaceHTMLAdressPath(dir);
    var result = [];
    fs.readdirSync(dir).forEach(function (file) {
        file = dir + "/" + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            result = result.concat(file);
        } else {
            result.push(file);
        }
    });
    res.send(result);
});

router.get("/null", function (_req, res) {
    res.sendFile(root + "/public/Images/fileDefault.png");
});

router.get("/dirname", (_req, res) => {
    res.send(root);
});
router.get("/CosmicDataLoc", (_req, res) => {
    res.send(CosmicComicsTemp);
});

router.get("/lang/:lang", (req, res) => {
    res.send(fs.readFileSync(root + "/languages/" + req.params.lang + ".json"));
});

router.post("/fillBlankImage", (req, res) => {
    let token = req.body.token;
    fillBlankImages(token);
    res.sendStatus(200);
});

router.get("/img/getColor/:img/:token", async (req, res) => {
    const token = resolveToken(req.params.token);
    var img = CosmicComicsTemp + "/profiles/" + token + "/current_book/" + req.params.img;
    const dominantColor = await getColor(img);
    res.send(dominantColor);
});
router.get("/img/getPalette/:token", async (req, res) => {
    console.log(req.headers.img);
    let img = req.headers.img;
    if (img.includes("localhost:" + port)) {
        img = 'public/' + img.split("localhost:" + port)[1];
    }
    if (img.includes("fileDefault")) {
        img = root + "/public/Images/fileDefault.png";
    }

    try {
        await getPalette(img).then(function (palette) {
            let rgb = "rgb(" + palette[0][0] + "," + palette[0][1] + "," + palette[0][2] + ")";
            let rgb2 = "rgb(" + palette[1][0] + "," + palette[1][1] + "," + palette[1][2] + ")";
            if (tinycolor(rgb).isLight()) {
                rgb = tinycolor(rgb).darken(45).toString();
            }
            if (tinycolor(rgb2).isLight()) {
                rgb2 = tinycolor(rgb2).darken(45).toString();
            }
            res.send([rgb, rgb2]);
        });
    } catch (error) {
        res.send(["rgb(33,33,33)", "rgb(33,33,33)"]);
    }

});

const multer = require("multer");

const upload = multer({ dest: CosmicComicsTemp + "/uploads/" });

router.post("/uploadComic", upload.single("ComicTemp"), function (req, res) {
    let file = req.file;
    console.log(file);
    fs.renameSync(file.path, CosmicComicsTemp + "/uploads/" + file.originalname);
    res.sendStatus(200);
});


router.post("/DL", function (req, res) {
    console.log(req.body);
    DLBOOKPATH = req.body.path;
    res.sendStatus(200);
});
router.get("/getDLBook", function (_req, res) {
    if (DLBOOKPATH === "") {
        res.sendStatus(404);
    } else if (fs.existsSync(DLBOOKPATH) && !fs.statSync(DLBOOKPATH).isDirectory()) {
        res.download(DLBOOKPATH);
    } else if (fs.statSync(DLBOOKPATH).isDirectory()) {
        const compress = Seven.add(root + "/public/TODL/" + path.basename(DLBOOKPATH) + ".zip", DLBOOKPATH, {
            recursive: true,
            $bin: Path27Zip
        });
        compress.on("error", (err) => {
            console.log(err);
        });
        compress.on("end", () => {
            console.log("Compressed");
            res.download(root + "/public/TODL/" + path.basename(DLBOOKPATH) + ".zip");
        });
    } else {
        res.sendStatus(404);
    }
});

router.get("/BM/getBM", (req, res) => {
    try {
        var result = [];
        const token = resolveToken(req.headers.token);
        getDB(token).all("SELECT * FROM Bookmarks;", function (err, resD) {
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

router.post("/downloadBook", function (req, res) {
    if (fs.existsSync(CosmicComicsTemp + "/downloads") === false) {
        fs.mkdirSync(CosmicComicsTemp + "/downloads");
    }
    const python = spawn("python", [root + "/external_scripts/bookDownloader.py", req.body.url, CosmicComicsTemp + "/downloads/" + req.body.name + "/" + req.body.vol]);
    python.stdout.on('data', (data) => {
        console.log(data.toString());
    });
    python.on('close', (code) => {
        console.log(`child process close all stdio with code ${code}`);
        res.sendStatus(200);
    });
});
module.exports = router;