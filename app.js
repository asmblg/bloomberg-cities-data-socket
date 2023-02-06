require('dotenv').config();
const { CensusAPISocket, WebDriverSocket, XLSXSocket } = require('./modules');
const { getDataSocketConfig, getDbConnection } = require('./globalUtils/API');
// const util = require('util');


const run = async () => {
  // Ensure DB URI is present
  if (process.env.MONGODB_URI) {
    // Connect to DB
    // const db = await getDbConnection(process.env.MONGODB_URI);

    // Get config array from DB
    // const dataSocketConfigs = await getDataSocketConfig(db);
    const dataSocketConfigs = require('./modules/WebDriverSocket/devConfig.json');

    // Execute data socket by data socket type
    for await ({
      project,
      type,
      url,
      query,
      mappings,
      description,
      tableDescription,
      source,
      sheetName,
      fileName,
      directoryID,
      startDate,
      endDate,
      queryID    
    } of dataSocketConfigs) {
      switch (type) {
        // case 'CensusAPI': {
        //   await CensusAPISocket({
        //     db,
        //     project,
        //     url,
        //     query,
        //     mappings,
        //     description,
        //     tableDescription
        //   });
        //   break;
        // }
        case 'WebDriver': {
          await WebDriverSocket({
            source,
            startDate,
            endDate,
            queryID          
          }).then(result => console.log(project, startDate, endDate, result));
          break;
        }
        // case 'XLSX' : {
        //   await XLSXSocket({
        //     project,
        //     sheetName,
        //     mappings,
        //     fileName,
        //     directoryID,
        //     clientID: process.env.MS_CLIENT_ID,
        //     clientSecret: process.env.MS_CLIENT_SECRET,
        //     db: db
        //   });
        //   break;
        // }
        default: {
          console.log(type, 'Data Socket Unsupported:', description);
          break;
        }
      }
    }
  } else {
    throw new Error('No MONGODB_URI environment variable');
  }
};

run()
  .then(() => {
    console.log('\nProcess complete. Exiting...\n');
    process.exit(0);
  })
  .catch(err => {
    console.log(err);
    console.log('\nExiting...\n');
    process.exit(1);
  });
