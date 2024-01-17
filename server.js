let express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
app.use("", express.static(__dirname + "/public"));
const { setRoot, setCosmicComicsTemp, isDevMode, CosmicComicsTemp } = require("./utils/GlobalVariable");



if (isDevMode()) {
    setCosmicComicsTemp(path.join(__dirname, "CosmicData"));
}
//Creating the folders to the CosmicData's path
fs.mkdirSync(CosmicComicsTemp, { recursive: true });

if (!fs.existsSync(CosmicComicsTemp + "/.env")) {
    fs.writeFileSync(CosmicComicsTemp + "/.env", fs.readFileSync(__dirname + "/.env.sample"));
}
const dotenv = require('dotenv');
dotenv.config({
    path: CosmicComicsTemp + "/.env"
});

setRoot(__dirname);
setCosmicComicsTemp(CosmicComicsTemp);

const changePermissionForFilesInFolder = require("./utils/Utils").changePermissionForFilesInFolder;

//If the serverconfig.json doesn't exist, create it
if (!fs.existsSync(CosmicComicsTemp + "/serverconfig.json")) {
    const obj = {
        "Token": {},
        "port": 4696
    };
    fs.writeFileSync(CosmicComicsTemp + "/serverconfig.json", JSON.stringify(obj), { encoding: 'utf8' });
} else {
    if (isDevMode() === false) {
        //Reseting the serverconfig.json for revoking tokens
        let configFile = fs.readFileSync(CosmicComicsTemp + "/serverconfig.json");
        let config = JSON.parse(configFile);
        config["Token"] = {};
        fs.writeFileSync(CosmicComicsTemp + "/serverconfig.json", JSON.stringify(config), { encoding: 'utf8' });
    }
}

try {
    if (!fs.existsSync(__dirname + "/public/FirstImagesOfAll")) {
        fs.mkdirSync(__dirname + "/public/FirstImagesOfAll");
        changePermissionForFilesInFolder(__dirname + "/public/FirstImagesOfAll");
    }
} catch (e) {
    console.log(e);
}
const cors = require('cors');

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

try {
    const swaggerUI = require("swagger-ui-express");
    const swaggerDoc = require("./swagger.json");
    app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDoc));
} catch (e) {
    console.log("Swagger not found");
}

let host;
const args = process.argv.slice(2);
let port = JSON.parse(fs.readFileSync(CosmicComicsTemp + "/serverconfig.json").toString()).port;
for (let i = 0; i < args.length; i++) {
    if (args[i] === "-p" || args[i] === "--port") {
        port = args[i + 1];
        break;
    }
}
const server = app.listen(port, "0.0.0.0", function () {
    host = this.address().address;
    port = this.address().port;
    console.log("Listening on port %s:%s!", host, port);
});
app.use((req, _res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});


const general = require("./routes/General");
const config = require("./routes/Config");
const profile = require("./routes/Profile");
const AniListR = require("./routes/AniList");
const MarvelR = require("./routes/Marvel");
const GoogleR = require("./routes/GoogleBooks");
const Viewer = require("./routes/Viewer");
const Database = require("./routes/Database");
const OLR = require("./routes/OpenLibrary");
const unzipR = require("./routes/Unzip").router;


app.use("/", general);
app.use("/", config);
app.use("/", profile);
app.use("/", AniListR);
app.use("/", MarvelR);
app.use("/", GoogleR);
app.use("/", Viewer);
app.use("/", Database);
app.use("/", OLR);
app.use("/", unzipR);


setInterval(() => {
    console.log("Resetting Tokens");
    var configFile = fs.readFileSync(CosmicComicsTemp + "/serverconfig.json", "utf8");
    var config = JSON.parse(configFile);
    for (var _i in config) {
        config["Token"] = {};
    }
    fs.writeFileSync(CosmicComicsTemp + "/serverconfig.json", JSON.stringify(config));
}, 2 * 60 * 60 * 1000);
setInterval(() => {
    console.log("Removing ZIPs to DL");
    if (fs.existsSync(__dirname + "/public/TODL")) {
        fs.rmSync(__dirname + "/public/TODL", { recursive: true, force: true });
    }
}, 2 * 60 * 60 * 1000);

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing server');
    console.log("Removing ZIPs to DL");
    if (fs.existsSync(__dirname + "/public/TODL")) {
        fs.rmSync(__dirname + "/public/TODL", { recursive: true, force: true });
    }
    if (fs.existsSync(CosmicComicsTemp + "/uploads")) {
        fs.rmSync(CosmicComicsTemp + "/uploads", { recursive: true, force: true });
    }
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

//REACT ROUTER
console.log("REACT ROUTER : ", process.env.ENABLE_REACT_ROUTER);
if (process.env.ENABLE_REACT_ROUTER === "true") {
    app.use((_req, res, _next) => {
        if (fs.existsSync(__dirname + "/public/index.html")) {
            res.sendFile(path.join(__dirname, "public", "index.html"));
        } else {
            res.sendFile(__dirname + "/noClient.html");
        }
    });
}

//If page not found
app.all('*', (req, res) => {
    if (process.env.ENABLE_REACT_ROUTER === "false") {
        if (req.headers["user-agent"].includes("Mozilla")) {
            if (fs.existsSync(__dirname + "/public/404.html")) {
                res.sendFile(__dirname + "/public/404.html");
            } else {
                res.sendFile(__dirname + "/noClient.html");
            }
            return;
        }
    }
    res.send("This server cannot handle this request");
});

