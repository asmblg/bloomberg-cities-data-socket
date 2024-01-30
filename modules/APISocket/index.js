const { 
  getCensusData, 
  getBLSData ,
  // mapInNewData 
} = require('./utils');

const APISocket = async (config) => {
  // Get Data from Census API
  switch (config.type) {
    case 'CensusAPI':
      return await getCensusData(config);
    case 'BLS API':
      return await getBLSData(config);
  
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
