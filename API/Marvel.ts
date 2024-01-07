async function API_MARVEL_GET(name = "") {
    console.log("API_MARVEL_GET: " + name);
    if (name === "") {
        console.log("no name provided, aborting GETMARVELAPI");
        return;
    }
    let date = "";
    let dateNb = 0;
    let dateFromName = name.replace(/[^0-9]/g, "#");
    dateFromName.split("#").forEach(function (element) {
        if (dateNb === 0 && element.match(/^[0-9]{4}$/)) {
            dateNb++;
            date = element;
        }
    });
    name = name.replaceAll(/[(].+[)]/g, "");
    name = name.replace(/\s+$/, "");
    let encodedName = encodeURIComponent(name);
    let url;
    if (date !== "") {
        url = "https://gateway.marvel.com:443/v1/public/series?titleStartsWith=" + encodedName + "&startYear=" + date + generateMarvelAPIAuth();
    } else {
        url = "https://gateway.marvel.com:443/v1/public/series?titleStartsWith=" + encodedName + generateMarvelAPIAuth();
    }
    let response = await fetch(url);
    return await response.json();
}

/**
 * Recover the Marvel API data from the server
 * @param {string} what - What to recover (characters, comics, creators, events, series, stories)
 * @param {string} id - The id of the element to recover
 * @param {string} what2 - What to recover (characters, comics, creators, events, series, stories)
 * @param {boolean|string} noVariants - If the comics should be without variants
 * @param {string} orderBy - How to order the results
 * @param {string} type - The type of the element to recover (comic, collection, creator, event, story, series, character)
 */
function recoverMarvelAPILink(what, id, what2, noVariants = true, orderBy = "issueNumber", type = null) {
    if (type != null) {
        return "https://gateway.marvel.com:443/v1/public/" + what + "?" + type + "=" + id + generateMarvelAPIAuth();
    }
    if (what2 === "") {
        return "https://gateway.marvel.com:443/v1/public/" + what + "/" + id + "?noVariants=" + noVariants + "&orderBy=" + orderBy + generateMarvelAPIAuth();
    }
    return "https://gateway.marvel.com:443/v1/public/" + what + "/" + id + "/" + what2 + "?noVariants=" + noVariants + "&orderBy=" + orderBy + generateMarvelAPIAuth();
}


function generateMarvelAPIAuth() {
    let ts = new Date().getTime();
    return "&ts=" + ts + "&hash=" + CryptoJS.MD5(ts + MarvelPrivateKey + MarvelPublicKey).toString() + "&apikey=" + MarvelPublicKey;
}


async function GETMARVELAPI_variants(id) {
    let url = recoverMarvelAPILink("series", id, "comics", true, "issueNumber")
    let response = await fetch(url);
    let data = await response.json();
    console.log(data);
    return data;
}

async function GETMARVELAPI_relations(id) {
    let url = recoverMarvelAPILink("series", id, "comics", true, "issueNumber")
    let response = await fetch(url);
    let data = await response.json();
    console.log(data);
    return data;
}

async function GETMARVELAPI_Characters(id, type) {
    let url = recoverMarvelAPILink("characters", id, "comics", true, "issueNumber", type)
    let response = await fetch(url);
    let data = await response.json();
    console.log(data);
    return data;
}

async function GETMARVELAPI_Creators(id, type) {
    let url = recoverMarvelAPILink("creators", id, "comics", true, "issueNumber", type)
    let response = await fetch(url);
    let data = await response.json();
    console.log(data);
    return data;
}

async function GETMARVELAPI_Comics_ByID(id) {
    let url = recoverMarvelAPILink("comics", id, "", true, "issueNumber")
    let response = await fetch(url);
    let data = await response.json();
    console.log(data);
    return data;
}

async function GETMARVELAPI_SEARCH(name = "", date = "") {
    if (name === "") {
        console.log("no name provided, aborting GETMARVELAPI");
        return;
    }
    name = name.replaceAll(/[(].+[)]/g, "");
    name = name.replace(/\s+$/, "");
    let encodedName = encodeURIComponent(name);
    let url;
    if (date !== "") {
        url = "https://gateway.marvel.com:443/v1/public/series?titleStartsWith=" + encodedName + "&startYear=" + date + generateMarvelAPIAuth();
    } else {
        url = "https://gateway.marvel.com:443/v1/public/series?titleStartsWith=" + encodedName + generateMarvelAPIAuth();
    }
    let response = await fetch(url);
    return await response.json();
}

async function GETMARVELAPI_Series_ByID(id) {
    let url = "https://gateway.marvel.com:443/v1/public/series?id=" + id + generateMarvelAPIAuth();
    console.log(url);
    let response = await fetch(url);
    let data = await response.json();
    console.log(data);
    return data;
}

async function GETMARVELAPI_Comics(name = "", seriesStartDate = "") {
    if (name === "") {
        console.log("GETMARVELAPI_Comics : name is empty");
        return;
    }
    if (seriesStartDate === "") {
        console.log("GETMARVELAPI_Comics : seriesStartDate is empty");
        return;
    }
    let issueNumber = "";
    let inbFromName = name.replace(/[^#0-9]/g, "&");
    console.log("inbFromName : " + inbFromName);
    inbFromName.split("&").forEach(function (element) {
        if (element.match(/^[#][0-9]{1,}$/)) {
            issueNumber = element.replaceAll("#", "");
        }
    });
    name = name.replaceAll(/[(].+[)]/g, "");
    name = name.replaceAll(/[\[].+[\]]/g, "");
    name = name.replaceAll(/[\{].+[\}]/g, "");
    name = name.replaceAll(/[#][0-9]{1,}/g, "");
    name = name.replace(/\s+$/, "");
    console.log("GETMARVELAPI_Comics : name : " + name);
    console.log("GETMARVELAPI_Comics : issueNumber : " + issueNumber);
    console.log("GETMARVELAPI_Comics : seriesStartDate : " + seriesStartDate);
    let url;
    if (seriesStartDate !== "" && issueNumber !== "") {
        url = "https://gateway.marvel.com:443/v1/public/comics?titleStartsWith=" + encodeURIComponent(name) + "&startYear=" + seriesStartDate + "&issueNumber=" + issueNumber + "&noVariants=true" + generateMarvelAPIAuth();
    } else {
        url = "https://gateway.marvel.com:443/v1/public/comics?titleStartsWith=" + encodeURIComponent(name) + "&noVariants=true" + generateMarvelAPIAuth();
    }
    let response = await fetch(url);
    let data = await response.json();
    console.log(data);
    return data;
}