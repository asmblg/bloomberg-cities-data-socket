require('dotenv').config();
const { CensusAPISocket, WebDriverSocket } = require('./modules');
const { getDataSocketConfig, getDbConnection } = require('./globalUtils/API');
const util = require('util');


const run = async () => {
  // Ensure DB URI is present
  if (process.env.MONGODB_URI) {
    // Connect to DB
    const db = await getDbConnection(process.env.MONGODB_URI);
    // Get config array from DB
    const dataSocketConfig = await getDataSocketConfig(db);
    // Execute data socket by data socket type
    for await ({
      project,
      type,
      url,
      query,
      mappings,
      description,
      tableDescription,
      source
    } of dataSocketConfig) {
      switch (type) {
        case 'CensusAPI': {
          await CensusAPISocket({
            db,
            project,
            url,
            query,
            mappings,
            description,
            tableDescription
          });
          break;
        }
        case 'WebDriver': {
          await WebDriverSocket({url, source, project});
          break;
        }
        default: {
          console.log('Data Socket Type Unsupported:', description);
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
