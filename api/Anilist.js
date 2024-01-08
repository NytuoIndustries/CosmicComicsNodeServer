async function API_ANILIST_GET(nameroot) {
  let query =
    `query ($page: Int, $perPage: Int, $search: String) {
  Page(page:$page,perPage:$perPage){
    pageInfo{
      total
    }
    media(type: MANGA,search:$search){
      id
      title{
        romaji
        english
        native
      }
      status
      startDate{
        year
        month
        day
      }
      endDate{
        year
        month
        day
	  }
	  description
	  meanScore
	  genres
	  coverImage{
	  large
	  }
	  bannerImage
	  trending
	  siteUrl
	  volumes
	  chapters
      staff{
        nodes{
          id
          name {
            full
            native
          }
          image {
            medium
          }
          description
          siteUrl
        }
        edges{
        role
        }
      }
      characters{
        nodes{
          id
          name {
            full
            native
          }
          image {
            medium
          }
          description
          siteUrl
        }
        edges{
        role
        }
      }
      relations{
        nodes{
          id
          title{
            romaji
            english
            native
          }
          coverImage{
          large
          }
          type
          format
        }
        edges{
          relationType
        }        
      }
    }
  }
}`;
  let variables = {
    search: name,
    page: 1,
    perPage: 5
  };
  let url = 'https://graphql.anilist.co',
    options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        variables: variables
      })
    };
  let results = {};
  await fetch(url, options).then(handleResponse).then(handleData).catch(handleError);

  function handleResponse(response) {
    return response.json().then(function (json) {
      return response.ok ? json : Promise.reject(json);
    });
  }

  // duplicate an object
  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function handleData(dataroot) {
    console.log(data);
    if (data.data.Page.media.length === 0) {
      results = null;
      return;
    }
    let baseObject = clone(data.data.Page.media[0]);
    let staffObject = clone(data.data.Page.media[0].staff.nodes);
    let charactersObject = clone(data.data.Page.media[0].characters.nodes);
    let relationsObjectNodes = clone(data.data.Page.media[0].relations.nodes);
    let relationsObjectEdges = clone(data.data.Page.media[0].relations.edges);
    let relationsObjectroot = [];
    for (let i = 0; i < relationsObjectNodes.length; i++) {
      relationsObject[i] = relationsObjectNodes[i];
      relationsObject[i]["relationType"] = relationsObjectEdges[i].relationType;
    }
    delete baseObject["relations"];
    for (let i = 0; i < baseObject.staff.nodes.length; i++) {
      for (let key in baseObject.staff.nodes[i]) {
        if (key !== "id" && key !== "name") {
          delete baseObject.staff.nodes[i][key];
        }
      }
      baseObject.staff.nodes[i]["name"] = baseObject.staff.nodes[i]["name"]["full"];
    }
    baseObject.staff = baseObject.staff.nodes;
    for (let i = 0; i < baseObject.characters.nodes.length; i++) {
      for (let key in baseObject.characters.nodes[i]) {
        if (key !== "id" && key !== "name") {
          delete baseObject.characters.nodes[i][key];
        }
      }
      baseObject.characters.nodes[i]["name"] = baseObject.characters.nodes[i]["name"]["full"];
    }
    baseObject.characters = baseObject.characters.nodes;
    results = {
      "base": baseObject,
      "staff": staffObject,
      "characters": charactersObject,
      "relations": relationsObject
    };
  }

  return results;

  function handleError(errorroot) {
    console.error(error);
  }
}

async function API_ANILIST_GET_SEARCH(nameroot) {
  let query =
    `query ($page: Int, $perPage: Int, $search: String) {
  Page(page:$page,perPage:$perPage){
    pageInfo{
      total
    }
    media(type: MANGA,search:$search){
      id
      title{
        romaji
        english
        native
      }
	  coverImage{
	  large
	  }
    }
  }
}`;
  let variables = {
    search: name,
    page: 1,
    perPage: 20
  };
  let url = 'https://graphql.anilist.co',
    options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        variables: variables
      })
    };
  let results = {};
  await fetch(url, options).then(handleResponse).then(handleData).catch(handleError);

  function handleResponse(response) {
    return response.json().then(function (json) {
      return response.ok ? json : Promise.reject(json);
    });
  }

  // duplicate an object
  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function handleData(dataroot) {
    console.log(data);
    if (data.data.Page.media.length === 0) {
      results = null;
      return;
    }
    let baseObject = clone(data.data.Page.media);
    results = {
      "base": baseObject,
    };
  }

  return results;

  function handleError(errorroot) {
    console.error(error);
  }
}



module.exports = {
  API_ANILIST_GET,
  API_ANILIST_GET_SEARCH
};