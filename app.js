const axios = require('axios');

const config = require('config');
const citiesData = require('data');



const run = async () => {
  for await ({project, type, url, query, mappings} of config) {
    if (type === 'API') {
      const {data} = axios.get({
        "url": url,
        "query": query
      });
      const cityData = citiesData[project];

      for await ({destination, origin, mapping} of mappings ) {
        cityData[destination] = data[origin]
      }

    }
  }
}