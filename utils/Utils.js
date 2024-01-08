const fs = require("fs");
const { root, CosmicComicsTemp } = require("../server");
var rand = function () {
    return Math.random().toString(36).substring(2); // remove `0.`
};
var tokena = function () {
    return rand() + rand(); // to make it longer
};
let mangaMode = false;
const { unzip_first } = require("./Unzipper");
const { getDB, UpdateDB } = require("./Database");
const ValidatedExtensionImage = [
    "png",
    "jpg",
    "jpeg",
    "bmp",
    "apng",
    "svg",
    "ico",
    "webp",
    "gif",
    "tiff",
];
/**
 * Check if the passed param has number in it
 * @param {string} toCheck
 */
function hasNumbers(toCheck) {
    const regex = /\d/g;
    return regex.test(toCheck);
}

/**
 * Get the name without some special characters
 * @param {string} CommonName
 * @return {string} finalName
 */
function GetTheName(CommonName = "") {
    CommonName = CommonName.replaceAll("-", " ");
    CommonName = CommonName.replaceAll(")", " ");
    CommonName = CommonName.replaceAll("(", " ");
    CommonName = CommonName.replaceAll("[", " ");
    CommonName = CommonName.replaceAll("]", " ");
    CommonName = CommonName.replace(/\.[^/.]+$/, "");
    let s = CommonName.split(" ");
    let finalName = "";
    console.log(s);
    s.forEach((el) => {
        console.log(parseInt(el));
        if (el !== "") {
            if (hasNumbers(el)) {
                finalName += el;
            } else if (isNaN(parseInt(el))) {
                finalName += el[0];
            } else {
                finalName += el;
            }
        }
    });
    console.log(finalName);
    return finalName;
}

async function changePermissionForFilesInFolder(folderPath) {
    fs.chmodSync(folderPath, 0o777);
    console.log("chmod 777 for " + folderPath);
    fs.readdirSync(folderPath, (_err, files) => {
        files.forEach((file) => {
            fs.chmodSync(folderPath + "/" + file, 0o777);
            console.log("chmod 777 for " + folderPath + "/" + file);
        });
    });
}

function replaceHTMLAdressPath(path) {
    var HTMLParam = path.replaceAll("%20", " ");
    HTMLParam = HTMLParam.replaceAll("ù", "/").replaceAll("%C3%B9", "/").replaceAll("%23", "#");
    return HTMLParam;
}


function GetElFromInforPath(search, info) {
    for (var i in info) {
        if (i == search) {
            return info[i];
        }
    }
    return null;
}
const webp = require('webp-converter');

async function WConv(file) {
    try {
        webp.grant_permission();
    } catch (error) {
        console.log("WEBP CONVERTER ERROR: " + error);
    }
    let oldfile = root + "/public/FirstImagesOfAll/" + file;
    let newfile = root + "/public/FirstImagesOfAll/" + path.basename(file) + ".webp";
    try {
        if (path.extname(file) !== ".webp") {
            await webp
                .cwebp(oldfile, newfile, "-q 80 -noalpha -resize 250 380")
                .then((response) => {
                    console.log(response);
                    fs.rmSync(oldfile);
                });
            return newfile;
        }
    } catch (error) {
        console.log(error);
    }
    return newfile;
}

function fillBlankImages(token) {
    //get the null, "null", "undefined", blank cover or BannerImage from the books DB
    try {
        let result = [];
        getDB(resolveToken(token)).all("select * from Books where URLCover IS NULL OR URLCover = 'null' OR URLCover='undefined';", async function (err, resD) {
            if (err) return console.log("Error getting element", err);
            resD.forEach((row) => {
                console.log(row);
                result.push(row);
            });
            for (const book of result) {
                console.log("Beggining fillBlankImages for : " + book.NOM);
                let filename = book.ID_book;
                try {
                    unzip_first(book.PATH, root + "/public/FirstImagesOfAll", path.extname(book.PATH).replaceAll(".", ""), token, filename);
                    await changePermissionForFilesInFolder(root + "/public/FirstImagesOfAll/");
                    /*
                                        let newpath = await WConv(filename + ".jpg");
                    */
                    UpdateDB("noedit", "URLCover", "'" + root + "/public/FirstImagesOfAll/" + filename + ".jpg'", token, "Books", "ID_book", book.ID_book);
                } catch (e) {
                    console.log("NOT SUPPORTED");
                }
            }
        });
    } catch (e) {
        console.log(e);
    }
    //Unzip the first image for each with their path to a folder
    //Convert it in webp
    //Replace the null, "null", "undefined", blank cover or BannerImage from the books DB with the new webp
}

//Getting the list of images
function GetListOfImg(dirPath) {
    if (fs.existsSync(dirPath)) {
        var listoffiles = fs.readdirSync(dirPath);
        var listOfImage = [];
        listoffiles.forEach((file) => {
            var ext = file.split(".").pop();
            if (ValidatedExtensionImage.includes(ext)) {
                listOfImage.push(file);
            } else {
                console.log(file + " has an no compatible Viewer Extension: " + ext);
            }
        });
        if (mangaMode == true) {
            return listOfImage.reverse();
        } else {
            if (listOfImage.length == 0) {
                return false;
            } else {
                return listOfImage;
            }
        }
    } else {
        return [];
    }
}

function resolveToken(token) {
    let configFile = fs.readFileSync(CosmicComicsTemp + "/serverconfig.json", "utf8");
    let config = JSON.parse(configFile);
    for (let _i in config) {
        for (let j in config["Token"]) {
            if (config["Token"][j] === token) {
                return j;
            }
        }
    }
}

module.exports = {
    tokena,
    GetElFromInforPath,
    GetTheName,
    hasNumbers,
    replaceHTMLAdressPath,
    WConv,
    fillBlankImages,
    GetListOfImg,
    resolveToken,
    changePermissionForFilesInFolder,
};