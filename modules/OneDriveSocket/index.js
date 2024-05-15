// const util = require('util');
// const { coordAll } = require('@turf/turf');
// const { getProjectData, updateProjectData } = require('../../globalUtils/API');
const { 
  // parseXLSX,
  getToken,
  fetchFromOneDrive,
  // mapInNewData,
  processData,
  runCalculations 
} = require('./utils')


const { 
  parsePDFviaLink,
  parseFromText,
  parseTextFromImage 
} = require('../WebDriverSocket/utils')

const OneDriveSocket = async ({
  // project,
  sheetName,
  mappings,
  fileName,
  fileQuery,
  directoryID,
  project,
  useText,
  pageRange,
  fileType,
  // db,
  clientID,
  clientSecret
}) => {
  const { access_token: msGraphToken } = await getToken({clientID, clientSecret});
  const filesInDirectory = await fetchFromOneDrive({
    directory: directoryID,
    accessToken: msGraphToken
  });

  // console.log(filesInDirectory);

  const files = filesInDirectory
    .filter(({ name }) => {
      if (fileName) {
        return name.search(fileName) !== -1;
      }
      if (fileQuery) {
        const boolArray = []
        const keys = Object.keys(fileQuery);
        keys.forEach(key => {
          const queryValue = fileQuery[key];
          if (Array.isArray(queryValue)) {
            queryValue.forEach(value => {
              if (name.search(value) !== -1) {
                boolArray.push(true);
              }
            })
          } else if (name.search(queryValue) !== -1) {
            boolArray.push(true);
          }
        });
        return boolArray.length === keys.length;
      } 
    })

  if (files?.[0]) {

    let result = {};

    for await (const file of files){

      if (fileType === 'PDF') {
        await parsePDFviaLink({
          link: file['@microsoft.graph.downloadUrl'], 
          project, 
          // tablePage,
          // pageRange
    
        }).catch(err => {throw err});
  
        if (useText) {
          result = await parseFromText({
            textPaths: pageRange
              ? pageRange.map(pageNum =>
                `./data/pdfparse/${project}/text-${pageNum}.txt`
                )
              : null
          }).catch(err => {throw err});
  
          return result;
  
        } else {
          result = await parseTextFromImage({
            imagePath : `./data/pdfparse/${project}/page-${tablePage}.png`,
            rows,
            values,
            rowOffset 
          }).catch(err => {throw err});
        }
      }

      if (fileType === 'XLSX') {
        const worksheet = await fetchFromOneDrive({
          file: file.id,
          sheet: sheetName,
          accessToken: msGraphToken
        });

        console.log(worksheet.length);


        result = processData({mappings, worksheet});
        // console.log('processed:', result);
      }

    };

    result = runCalculations({mappings, result})
    // console.log('calculated:', result);
    return result;

  }


}

module.exports = OneDriveSocket;

