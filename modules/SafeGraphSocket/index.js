// const { readdir } = require('fs/promises');
const {
  // gzipToMongoDB, 
  // getFileLinks, 
  // downloadFiles,
  safegraphDataToDB,
  updateDataDashboard,
  // deleteRecords
} = require('./utils');

const SafeGraphSocket = async config => {
  const {

    // *** For removing old spending data from DB
    // cleanupConfig,
    rawDataUpdateConfig,
    dashboardDataUpdate,
    dbURI

  } = config;

  // if (cleanupConfig) {
  //   await deleteRecords(cleanupConfig);
  // };

  if (rawDataUpdateConfig) {
    // const {
    //   directoryArray,
    //   dbName,
    //   collectionName,
    // } = rawDataUpdateConfig;

    // for await (sourceDirectory of directoryArray) {
      await safegraphDataToDB({
        // sourceDirectory,
        dbURI,
        ...rawDataUpdateConfig
      });

    //   console.log(`Data from ${sourceDirectory} added to ${dbName } --> ${collectionName}`)
    // };
  };

  if (dashboardDataUpdate) {
      const dataObject = await updateDataDashboard({
        rawDataURI: dbURI,
        dashboardDataUpdate
      });

      return dataObject
  } else {
    return null;
  }
};

module.exports = SafeGraphSocket;