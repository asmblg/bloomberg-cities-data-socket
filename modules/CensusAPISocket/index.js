const { getProjectData, updateProjectData } = require('../../globalUtils/API');
const { getCensusData, mapInNewData } = require('./utils');

const CensusAPISocket = async ({
  project,
  url,
  query,
  mappings,
  db,
  description,
  tableDescription
}) => {
  // Get Data from Census API
  const censusData = await getCensusData(url, query);
  // Get project id and data object from DB
  const { _id, data } = await getProjectData(db, project);
  // Use config mapping to update project data and return only the data object
  const updatedData = mapInNewData({ censusData, data, mappings });
  // Update project data object in db
  await updateProjectData(db, _id, updatedData).then(() =>
    console.log(`${project}: ${description} - ${tableDescription} updated`)
  );
};

module.exports = CensusAPISocket;
