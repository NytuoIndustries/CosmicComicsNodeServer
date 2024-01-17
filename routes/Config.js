express = require("express");
router = express.Router();
const fs = require("fs");
const { changePermissionForFilesInFolder, resolveToken } = require("../utils/Utils");
const { root, CosmicComicsTemp } = require("../utils/GlobalVariable");
const makeDB = require("../utils/Database").makeDB;
const path = require("path");
router.post("/configServ/:name/:passcode/:port", (req, res) => {
    console.log("creating user");
    const name = req.params.name;
    const passcode = req.params.passcode;
    fs.mkdirSync(CosmicComicsTemp + "/profiles/" + name, { recursive: true });
    changePermissionForFilesInFolder(CosmicComicsTemp + "/profiles/" + name);
    console.log("Creating dir " + name);
    fs.writeFileSync(CosmicComicsTemp + "/profiles/" + name + "/passcode.txt", passcode, { encoding: "utf8" });
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
    let random = Math.floor(Math.random() * (fs.readdirSync(root + "/public/Images/account_default/").length - 1) + 1);
    fs.copyFileSync(root + "/public/Images/account_default/" + random + ".jpg", CosmicComicsTemp + "/profiles/" + name + "/pp.png");
    makeDB(name);
    console.log("User created");
    res.sendStatus(200);
});
router.get("/getThemes", (req, res) => {
    var oi = fs.readdirSync(root + "/public/themes");
    let result = [];
    oi.forEach((el) => {
        result.push(el, path.basename(root + "/public/themes/" + el).split(".")[0]);
    });
    res.send(result);
});
router.post('/config/writeConfig/:token', (req, res) => {
    console.log(req.body);
    const token = resolveToken(req.params.token);
    fs.writeFileSync(CosmicComicsTemp + "/profiles/" + token + "/config.json", JSON.stringify(req.body, null, 2));
    res.sendStatus(200);
});

router.get("/themes/read/:jsonFile", (req, res) => {
    res.send(fs.readFileSync(root + "/public/themes/" + req.params.jsonFile));
});
router.get("/config/getConfig/:token", (req, res) => {
    const token = resolveToken(req.params.token);
    res.send(fs.readFileSync(CosmicComicsTemp + "/profiles/" + token + "/config.json"));
});
module.exports = router;