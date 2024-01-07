function unzip_first(zipPath, ExtractDir, ext, token, fileName) {
    //Unzip the first image
    //premiere image si dossier
    console.log(fileName);
    try {
        let n = 0;
        if (
            ext === "zip" ||
            ext === "cbz" ||
            ext === "7z" ||
            ext === "cb7" ||
            ext === "tar" ||
            ext === "cbt"
        ) {
            let fromfile = [];
            let cherrypick = [
                "*.jpg",
                "*.png",
                "*.jpeg",
                "*.bmp",
                "*.apng",
                "*.svg",
                "*.ico",
                "*.webp",
                "*.gif",
            ];
            const Streamer = Seven.list(zipPath, {
                recursive: true,
                $cherryPick: cherrypick,
                $bin: Path27Zip,
            });
            Streamer.on("data", function (data) {
                fromfile.push(data.file);
            });
            Streamer.on("end", function () {
                const Stream = Seven.extract(zipPath, ExtractDir, {
                    recursive: true,
                    $cherryPick: fromfile[0],
                    $bin: Path27Zip
                });
                Stream.on("end", function () {
                    if (Stream.info.get("Files") === "0") {
                        console.log("no file found");
                        //no file found
                    } else {
                        fs.renameSync(ExtractDir + "/" + fromfile[0], ExtractDir + "/" + fileName + ".jpg");
                        console.log("file found and extracted : " + ExtractDir + "/" + fileName + ".jpg");
                    }
                });
                Stream.on("error", (err) => {
                    console.log("An error occured" + err);
                });
            })
        } else if (ext === "rar" || ext === "cbr") {
            let configFile = fs.readFileSync(CosmicComicsTemp + "/profiles/" + token + "/config.json");
            let parsedJSON = JSON.parse(configFile);
            let provider = GetElFromInforPath("update_provider", parsedJSON);
            let archive;
            if (provider === "msstore") {
                archive = new Unrar({
                    path: zipPath,
                    bin: CosmicComicsTemp + "/unrar_bin/UnRAR.exe"
                });
            } else {
                archive = new Unrar({
                    path: zipPath,
                    bin: unrarBin
                });
            }
            archive.list(function (err, entries) {
                console.log(entries);
                //tri numérique
                entries.sort((a, b) => {
                    let fa = a.name.toLowerCase(),
                        fb = b.name.toLowerCase();
                    if (fa < fb) {
                        return -1;
                    }
                    if (fa > fb) {
                        return 1;
                    }
                    return 0;
                });
                entries.forEach((file) => {
                    for (let i in file) {
                        if (i === "name") {
                            let currentName = file[i];
                            currentName = currentName.toString();
                            let stream = archive.stream(currentName);
                            stream.on("error", console.error);
                            if (
                                currentName.includes("png") ||
                                currentName.includes("jpg") ||
                                currentName.includes("jpeg") ||
                                currentName.includes(".gif") ||
                                currentName.includes("bmp") ||
                                currentName.includes("apng") ||
                                currentName.includes("svg") ||
                                currentName.includes("ico") ||
                                currentName.includes("webp")
                            ) {
                                if (!fs.existsSync(ExtractDir + "/" + fileName + ".jpg")) {
                                    stream.pipe(
                                        fs.createWriteStream(ExtractDir + "/" + fileName + ".jpg")
                                    );
                                } else {
                                    console.log("file already exist");
                                }
                                return;
                            }
                        }
                    }
                });
            });
        } else {
            //throw error for try catch
            throw "not supported";
        }
    } catch (error) {
        if (error === "not supported") {
            throw "not supported";
        }
        console.log(error);
    }
}

//UnZip the archive
async function UnZip(zipPath, ExtractDir, name, ext, token) {
    var listOfElements;
    try {
        var n = 0;
        if (fs.existsSync(CosmicComicsTemp + "/profiles/" + resolveToken(token) + "/current_book")) {
            fs.rmSync(CosmicComicsTemp + "/profiles/" + resolveToken(token) + "/current_book", {
                recursive: true
            });
        }
        /*fs.mkdirSync(CosmicComicsTemp + "/profiles/" + resolveToken(token) + "/current_book");*/
        fs.mkdirSync(CosmicComicsTemp + "/profiles/" + resolveToken(token) + "/current_book");
        fs.writeFileSync(CosmicComicsTemp + "/profiles/" + resolveToken(token) + "/current_book/path.txt", zipPath);
        fs.chmodSync(__dirname + "/node_modules/7zip-bin/linux/x64/7za", 0o777);
        if (ext === "epub" || ext === "ebook") {
            var fromfile = "";
            const Stream = Seven.extractFull(zipPath, ExtractDir, {
                recursive: true,
                $bin: Path27Zip
            });
            var resEnd;

            Stream.on("progress", (progress) => {
                console.log(progress);
                statusProgress[token]["unzip"] = {
                    "status": "loading",
                    "percentage": progress.percent,
                    "current_file": progress.file,
                }
                console.log(progress);
            });

            Stream.on("end", async () => {
                statusProgress[token]["unzip"] = {
                    "status": "finish",
                    "percentage": 100,
                    "current_file": "",
                }
                listOfElements = fs.readdirSync(ExtractDir);
                const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
                const page = await browser.newPage();
                let bignb = 0;
                for (var i = 0; i < listOfElements.length; i++) {
                    var el = listOfElements[i];
                    if (el.includes(".xhtml")) {
                        await page.goto("file://" + ExtractDir + "/" + el, { waitUntil: "networkidle0" });
                        await page.emulateMediaType('print');
                        n = parseInt(name) + 1;
                        name = Array(5 - String(n).length + 1).join("0") + n;
                        await page.screenshot({ path: ExtractDir + "/" + name + ".png", fullPage: true });
                        bignb++;
                    }
                }
                await browser.close();
                let allFiles = fs.readdirSync(ExtractDir);
                allFiles.forEach((el) => {
                    if (!el.includes(".png")) {
                        fs.rmSync(ExtractDir + "/" + el, { recursive: true });
                    }
                });
                listOfElements = GetListOfImg(CosmicComicsTemp + "/profiles/" + resolveToken(token) + "/current_book");
                console.log("finish");
                console.log(zipPath);
                try {
                    try {
                        var result = [];
                        getDB(resolveToken(token)).all("SELECT last_page FROM Books WHERE PATH='" + zipPath + "';", function (err, resD) {
                            if (err) return console.log("Error getting element", err);
                            resD.forEach((row) => {
                                console.log(row);
                                result.push(row);
                            });
                            console.log(result);
                            SendTo(result[0].last_page);
                            return result[0].last_page;
                        });
                    } catch (e) {
                        console.log(e);
                    }
                } catch (error) {
                    console.log(error);
                }
            });
            Stream.on("error", (err) => {
                statusProgress[token]["unzip"] = {
                    "status": "error",
                    "percentage": 0,
                    "current_file": "",
                }
                console.log("An error occured" + err);
            });
        } else if (ext === "pdf") {

            const { spawn } = require('child_process');
            let ls;
            ls = spawn('convert', ['-density', '300', zipPath, ExtractDir + '/%d.jpg']);
            ls.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
                statusProgress[token]["unzip"] = {
                    "status": "loading",
                    "percentage": 0,
                    "current_file": ""
                }
                console.log(`stdout: ${data}`);

            });
            ls.stderr.on('data', (data) => {
                statusProgress[token]["unzip"] = {
                    "status": "error",
                    "percentage": 0,
                    "current_file": ""
                }
                console.log(`stderr: ${data}`);
            });
            ls.on('close', (code) => {

                statusProgress[token]["unzip"] = {
                    "status": "finish",
                    "percentage": 100,
                    "current_file": ""
                }

                console.log(`child process exited with code ${code}`);
                listOfElements = GetListOfImg(CosmicComicsTemp + "/profiles/" + resolveToken(token) + "/current_book");
                console.log("finish");
                var name1 = path.basename(zipPath);
                console.log(zipPath);
                var shortname = name1.split(".")[0];
                var lastpage = 0;
                try {
                    try {
                        var result = [];
                        getDB(resolveToken(token)).all("SELECT last_page FROM Books WHERE PATH='" + zipPath + "';", function (err, resD) {
                            if (err) return console.log("Error getting element", err);
                            resD.forEach((row) => {
                                console.log(row);
                                result.push(row);
                            });
                            console.log(result);
                            if (result === undefined || result.length == 0) {
                                SendTo(0);
                                return 0;
                            } else {

                                SendTo(result[0].last_page);
                                return result[0].last_page;
                            }
                        });
                    } catch (e) {
                        console.log(e);
                    }
                } catch (error) {
                    console.log(error);
                }
            });
        } else if (
            ext == "zip" ||
            ext == "cbz" ||
            ext == "7z" ||
            ext == "cb7" ||
            ext == "tar" ||
            ext == "cbt"
        ) {
            var fromfile = "";
            const Stream = Seven.extract(zipPath, ExtractDir, {
                recursive: true,
                $bin: Path27Zip
            });
            var resEnd;

            Stream.on("progress", (progress) => {
                console.log(progress);
                statusProgress[token]["unzip"] = {
                    "status": "loading",
                    "percentage": progress.percent,
                    "current_file": progress.file,
                }
                console.log(progress);
            });

            Stream.on("end", () => {
                statusProgress[token]["unzip"] = {
                    "status": "finish",
                    "percentage": 100,
                    "current_file": "",
                }
                listOfElements = GetListOfImg(CosmicComicsTemp + "/profiles/" + resolveToken(token) + "/current_book");
                console.log("finish");
                var name1 = path.basename(zipPath);
                console.log(zipPath);
                var shortname = name1.split(".")[0];
                var lastpage = 0;
                try {
                    try {
                        var result = [];
                        getDB(resolveToken(token)).all("SELECT last_page FROM Books WHERE PATH='" + zipPath + "';", function (err, resD) {
                            if (err) return console.log("Error getting element", err);
                            resD.forEach((row) => {
                                console.log(row);
                                result.push(row);
                            });
                            console.log(result);
                            if (result.length === 0) {
                                SendTo(0);
                                return 0;
                            }
                            SendTo(result[0].last_page);
                            return result[0].last_page;
                        });
                    } catch (e) {
                        console.log(e);
                    }
                } catch (error) {
                    console.log(error);
                }
            });
            Stream.on("error", (err) => {
                statusProgress[token]["unzip"] = {
                    "status": "error",
                    "percentage": 0,
                    "current_file": "",
                }
                console.log("An error occured" + err);
            });
        } else if (ext == "rar" || ext == "cbr") {
            var configFile = fs.readFileSync(CosmicComicsTemp + "/profiles/" + resolveToken(token) + "/config.json");
            var parsedJSON = JSON.parse(configFile);
            var provider = GetElFromInforPath("update_provider", parsedJSON);
            if (provider == "msstore") {
                var archive = new Unrar({
                    path: zipPath,
                    bin: CosmicComicsTemp + "/unrar_bin/UnRAR.exe"
                });
            } else {
                var archive = new Unrar({
                    path: zipPath,
                    bin: unrarBin
                });
            }
            archive.list(function (err, entries) {
                console.log(entries);
                //tri numérique
                entries.sort((a, b) => {
                    let fa = a.name.toLowerCase(),
                        fb = b.name.toLowerCase();
                    if (fa < fb) {
                        return -1;
                    }
                    if (fa > fb) {
                        return 1;
                    }
                    return 0;
                });
                entries.forEach((file, index) => {
                    for (var i in file) {
                        if (i == "name") {
                            var currentName = file[i];
                            currentName = currentName.toString();
                            var stream = archive.stream(currentName);
                            stream.on("error", (err) => {
                                statusProgress[token]["unzip"] = {
                                    "status": "error",
                                    "percentage": 0,
                                    "current_file": "",
                                }
                            });
                            if (!fs.existsSync(CosmicComicsTemp + "/profiles/" + resolveToken(token) + "/current_book")) {
                                fs.mkdirSync(CosmicComicsTemp + "/profiles/" + resolveToken(token) + "/current_book");
                            }
                            if (
                                currentName.includes("png") ||
                                currentName.includes("jpg") ||
                                currentName.includes("jpeg") ||
                                currentName.includes(".gif") ||
                                currentName.includes("bmp") ||
                                currentName.includes("apng") ||
                                currentName.includes("svg") ||
                                currentName.includes("ico") ||
                                currentName.includes("webp")
                            ) {
                                stream.pipe(
                                    fs.createWriteStream(CosmicComicsTemp + "/profiles/" + resolveToken(token) + "/current_book/" + name + ".jpg")
                                );
                                statusProgress[token]["unzip"] = {
                                    "status": "loading",
                                    "percentage": index / entries.length * 100,
                                    "current_file": currentName,
                                }
                                n = parseInt(name) + 1;
                                name = Array(5 - String(n).length + 1).join("0") + n;
                            }
                        }
                    }
                });
                statusProgress[token]["unzip"] = {
                    "status": "finish",
                    "percentage": 100,
                    "current_file": "",
                }
                /*postunrar();*/
            });
        } else {
            console.log("not supported");
        }
    } catch (error) {
        console.log(error);
    }
}