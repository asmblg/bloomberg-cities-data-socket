const { get } = require('lodash');
const { 
  getCensusData, 
  getBLSData ,
  getINEData,
  getESRIData,
  getDataCubeData,
  getEurostatData
  // mapInNewData 
} = require('./utils');

const APISocket = async (config) => {
  // Get Data from Census API
  switch (config.type) {
    case 'CensusAPI':
      return await getCensusData(config);
    case 'BLS API':
      return await getBLSData(config);  
    case 'INE API':
      return await getINEData(config);
    case 'ESRI API':
      return await getESRIData(config);
    case 'DataCube':
      return await getDataCubeData(config);
    case 'Eurostat API':
      return await getEurostatData(config);
      return null;
    default:
      return null;
  }

  // // Get project id and data object from DB
  // const { _id, data } = await getProjectData(db, project);
  // // Use config mapping to update project data and return only the data object
  // const updatedData = mapInNewData({ censusData, data, mappings });
  // // Update project data object in db
  // await updateProjectData(db, _id, updatedData).then(() =>
  //   console.log(`${project}: ${description} - ${tableDescription} updated`)
};

module.exports = APISocket;
