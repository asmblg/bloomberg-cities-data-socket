// const util = require('util');
const { getProjectData, updateProjectData } = require('../../globalUtils/API');
const { parseXLSX, getToken, fetchFromOneDrive, mapInNewData } = require('./utils')

const XLSXSocket = async ({
  project,
  sheetName,
  mappings,
  fileName,
  directoryID,
  db,
  clientID,
  clientSecret
}) => {
  const { access_token: msGraphToken } = await getToken({clientID, clientSecret});
  const filesInDirectory = await fetchFromOneDrive({
    directory: directoryID,
    accessToken: msGraphToken
  });
  const fileIDs = filesInDirectory
    .filter(({ name }) => name.search(fileName) !== -1)

  if (fileIDs[0]) {
    const worksheet = await fetchFromOneDrive({
      file: fileIDs[0].id,
      sheet: sheetName,
      accessToken: msGraphToken
    });

    // Parse Data from XLSX file
    const parsedData = await parseXLSX({
      mappings,
      worksheet
    });

    // Get project id and data object from DB
    const { _id, data: currentData } = await getProjectData(db, project);

    //Map in new data
    const updatedData = await mapInNewData({ parsedData, currentData });

    console.log(project,updatedData);

  }


}

module.exports = XLSXSocket;

