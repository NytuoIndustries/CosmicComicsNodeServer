let root;
let devMode = false;
let SendToUnZip = "";

const fs = require("fs");
const path = require("path");
const os = require("os");

const isPortable = fs.existsSync(path.join(__dirname, "portable.txt"));
const isElectron = fs.existsSync(path.join(__dirname, 'portable.txt')) && fs.readFileSync(path.join(__dirname, "portable.txt"), "utf8") === "electron";

let path2Data;
if (isPortable) {
    if (isElectron) {
        path2Data = path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'CosmicData');
    } else {
        path2Data = path.join(path.dirname(__dirname), 'CosmicData');
    }
} else {
    if (os.platform() === "win32") {
        path2Data = process.env.APPDATA + "/CosmicComics/CosmicData/";
    } else if (os.platform() === "darwin") {
        path2Data = process.env.HOME + "/Library/Application Support/CosmicComics/CosmicData/";
    } else if (os.platform() === "linux") {
        path2Data = process.env.HOME + "/.config/CosmicComics/CosmicData/";
    }
}
let CosmicComicsTemp = path2Data;

function setCosmicComicsTemp(path) {
    CosmicComicsTemp = path;
}

function setRoot(path) {
    root = path;
}

function isDevMode() {
    return devMode;
}

function SendTo(val) {
    console.log("sendto => " + val);
    SendToUnZip = val;
}

module.exports = {
    setCosmicComicsTemp,
    CosmicComicsTemp,
    setRoot,
    root,
    isDevMode,
    SendTo,
    SendToUnZip
}