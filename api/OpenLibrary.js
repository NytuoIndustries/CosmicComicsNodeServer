async function GETOLAPI_search(name = "") {
    if (name === "") {
        console.log("OL API : name is empty");
        return;
    }

    name = name.replaceAll(/[(].+[)]/g, "");
    name = name.replaceAll(/[\[].+[\]]/g, "");
    name = name.replaceAll(/[\{].+[\}]/g, "");
    name = name.replaceAll(/[#][0-9]{1,}/g, "");
    name = name.replace(/\s+$/, "");
    console.log("OL API : name : " + name);
    let url = "http://openlibrary.org/search.json?q=" + encodeURIComponent(name);
    let response = await fetch(url);
    let data = await response.json();
    return data;
}

async function GETOLAPI_book(key = "") {
    if (key === "") {
        console.log("OL API : key is empty");
        return;
    }
    console.log("OL API : book : " + key);
    // let url = "https://openlibrary.org/works/" + key + ".json"
    let url = "https://openlibrary.org/api/books?bibkeys=OLID:" + key + "&jscmd=details&format=json";
    let response = await fetch(url);
    let data = await response.json();
    return data;
}

async function GETOLAPI_Comics_ByID(id) {
    let url = "https://openlibrary.org/api/books?bibkeys=OLID:" + id.replace("_3", "") + "&jscmd=details&format=json";
    console.log(url);
    let response = await fetch(url);
    let data = await response.json();
    console.log(data);
    return data;
}