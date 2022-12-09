const { getDbData } = require('../../globalUtils/API');
const { getCensusData, mapInNewData } = require('./utils');
// const util = require('util');
const fs = require('fs');

const CensusAPISocket = async ({ project, url, query, mappings }) => {
  // Get Project Data from DB
  const cityData = await getDbData(project);
  // Get Data from Census API
  const censusData = await getCensusData(url, query);
  // Uses config mappings and new census data to update project data from DB
  const updatedCityData = mapInNewData({ censusData, cityData, mappings });

  // SET PROJECT DATA IN DB -------->
  // console.log(util.inspect(updatedCityData, { showHidden: false, depth: null, colors: true }));
  fs.writeFile(
    `./${project}-${query.for.search('tract') !== -1 ? 'tract' : 'state'}.json`,
    JSON.stringify(updatedCityData),
    err => (err ? console.log(err) : null)
  );
  // ------------------------------->
};

module.exports = CensusAPISocket;
