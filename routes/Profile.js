const express = require("express");
const RateLimit = require('express-rate-limit');
let router = express.Router();
const accountLimiter = RateLimit({
    windowMs: 1 * 60 * 1000 * 60,
    max: 100,
});
const { resolveToken, tokena, changePermissionForFilesInFolder } = require("../utils/Utils");
const fs = require("fs");
const path = require("path");
const { makeDB, getDB, disableOpenedDB } = require("../utils/Database");
const { root, CosmicComicsTemp } = require("../utils/GlobalVariable");
router.get("/profile/logcheck/:token", (req, res) => {
    const configFile = fs.readFileSync(CosmicComicsTemp + "/serverconfig.json", "utf8");
    const config = JSON.parse(configFile);
    for (const i in config) {
        for (const j in config["Token"]) {
            if (config["Token"][j] === req.params.token) {
                res.send(j);
                return;
            }
        }
    }
    res.send(false);
});

router.post("/profile/logout/:token", (req, res) => {
    const configFile = fs.readFileSync(CosmicComicsTemp + "/serverconfig.json", "utf8");
    const config = JSON.parse(configFile);
    for (const i in config) {
        for (const j in config["Token"]) {
            if (config["Token"][j] === req.params.token) {
                delete config["Token"][j];
                fs.writeFileSync(CosmicComicsTemp + "/serverconfig.json", JSON.stringify(config), { encoding: 'utf8' });
                res.sendStatus(200);
                return;
            }
        }
    }
    res.sendStatus(402);
});

router.post("/createUser", function (req, res) {
    const name = req.body.name;
    const passcode = req.body.password;
    fs.mkdirSync(CosmicComicsTemp + "/profiles/" + name, { recursive: true });
    changePermissionForFilesInFolder(CosmicComicsTemp + "/profiles/" + name);
    console.log("Creating dir " + name);
    fs.writeFileSync(CosmicComicsTemp + "/profiles/" + name + "/passcode.txt", passcode.trim(), { encoding: "utf8" });
    if (!fs.existsSync(CosmicComicsTemp + "/profiles/" + name + "/config.json")) {
        const obj = {
            path: "",
            last_opened: "",
            language: "us",
            update_provider: "",
            ZoomLVL: 10,
            Scroll_bar_visible: true,
            Background_color: "rgb(33,33,33)",
            WebToonMode: false,
            Vertical_Reader_Mode: false,
            Page_Counter: true,
            SideBar: false,
            NoBar: false,
            SlideShow: false,
            SlideShow_Time: 1,
            Rotate_All: 0,
            Margin: 0,
            Manga_Mode: false,
            No_Double_Page_For_Horizontal: false,
            Blank_page_At_Begginning: false,
            Double_Page_Mode: false,
            Automatic_Background_Color: false,
            magnifier_zoom: 1,
            magnifier_Width: 100,
            magnifier_Height: 100,
            magnifier_Radius: 0,
            reset_zoom: false,
            force_update: false,
            skip: false,
            display_style: 0,
            theme: "default.css",
            theme_date: true
        };
        fs.writeFileSync(
            CosmicComicsTemp + "/profiles/" + name + "/config.json",
            JSON.stringify(obj, null, 2), { encoding: "utf8" }
        );
    }
    if (req.body.pp == null) {
        let random = Math.floor(Math.random() * (fs.readdirSync(root + "/public/Images/account_default/").length - 1) + 1);
        fs.copyFileSync(root + "/public/Images/account_default/" + random + ".jpg", CosmicComicsTemp + "/profiles/" + name + "/pp.png");
    } else {
        let nppPath = req.body.pp.toString().replace(/http:\/\/(([0-9]{1,3}\.){3}[0-9]{1,3})?(localhost)?:[0-9]{4}/g, root + "/public");
        fs.copyFileSync(nppPath, CosmicComicsTemp + "/profiles/" + name + "/pp.png");
    }
    makeDB(name);
    console.log("User created");
    res.sendStatus(200);
});

//Deleting an account
router.post("/profile/deleteAccount", accountLimiter, (req, res) => {
    const token = resolveToken(req.body.token);
    getDB(token).close();
    disableOpenedDB(token);
    fs.rm(CosmicComicsTemp + "/profiles/" + token, { recursive: true, force: true }, function (err) {
        console.log(err);
    });
});

//Modifications of the profile
router.post("/profile/modification", accountLimiter, (req, res) => {
    const token = resolveToken(req.body.token);
    console.log(req.body.npp);
    if (req.body.npass != null) {
        fs.writeFileSync(CosmicComicsTemp + "/profiles/" + token + "/passcode.txt", req.body.npass.trim(), { encoding: "utf-8" });
    }
    if (req.body.npp != null) {
        let nppPath = req.body.npp.toString().replace(/http:\/\/(([0-9]{1,3}\.){3}[0-9]{1,3})?(localhost)?:[0-9]{4}/g, root + "/public");
        fs.copyFileSync(nppPath, CosmicComicsTemp + "/profiles/" + token + "/pp.png");
    }
    if (req.body.nuser != null) {
        fs.renameSync(CosmicComicsTemp + "/profiles/" + token, CosmicComicsTemp + "/profiles/" + req.body.nuser);
    }
    res.sendStatus(200);
});

router.get("/profile/login/:name/:passcode", accountLimiter, (req, res) => {
    if (fs.existsSync(CosmicComicsTemp + "/profiles/" + req.params.name + "/passcode.txt")) {
        const passcode = fs.readFileSync(CosmicComicsTemp + "/profiles/" + req.params.name + "/passcode.txt", "utf8");
        if (passcode === req.params.passcode) {
            let token = tokena();
            const configFile = fs.readFileSync(CosmicComicsTemp + "/serverconfig.json", "utf8");
            const config = JSON.parse(configFile);
            for (const i in config) {
                config["Token"][req.params.name] = token;
            }
            fs.writeFileSync(CosmicComicsTemp + "/serverconfig.json", JSON.stringify(config));
            fs.mkdirSync(CosmicComicsTemp + "/profiles/" + req.params.name + "/current_book", { recursive: true });
            res.send(token);
        } else {
            res.send(false);
        }
    } else {
        res.send(false);
    }
});

router.get("/profile/discover", (req, res) => {
    let result = [];
    try {
        fs.readdirSync(CosmicComicsTemp + "/profiles").forEach(function (file) {
            let resultOBJ = {};
            resultOBJ.name = path.basename(file, path.extname(file));
            resultOBJ.image = (req.headers["x-forwarded-proto"] || req.protocol) + "://" + req.headers.host + "/profile/getPPBN/" + path.basename(file, path.extname(file));
            resultOBJ.passcode = fs.existsSync(CosmicComicsTemp + "/profiles/" + file + "/passcode.txt");
            result.push(resultOBJ);
        });
    } catch (e) {
        console.log(e);
        console.log("No profile, First time setup...");
    }
    res.send(result);
});

router.get("/profile/DLBDD/:token", (req, res) => {
    const token = resolveToken(req.params.token);
    res.download(CosmicComicsTemp + "/profiles/" + token + "/CosmicComics.db", (err) => {
        if (err) console.log(err);
    });
});

router.get("/profile/getPP/:token", accountLimiter, (req, res) => {
    const token = resolveToken(req.params.token);
    res.sendFile(CosmicComicsTemp + "/profiles/" + token + "/pp.png");
});
router.get("/profile/getPPBN/:name", accountLimiter, (req, res) => {
    res.sendFile(CosmicComicsTemp + "/profiles/" + req.params.name + "/pp.png");
});
router.get("/profile/custo/getNumber", accountLimiter, (req, res) => {
    res.send({ "length": fs.readdirSync(root + "/public/Images/account_default").length });
});

module.exports = router;