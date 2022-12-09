const { CensusAPISocket } = require('./modules');
const { getConfig } = require('./globalUtils/API');

const run = async () => {
  // Get Config from DB
  const dataSocketConfig = await getConfig();

  for await ({ project, type, url, query, mappings } of dataSocketConfig) {
    switch (type) {
      case 'CensusAPI': {
        await CensusAPISocket({ project, url, query, mappings });
        break;
      }
      default: {
        console.log('no case hit');
      }
    }
  }
  return;
};

run().then(() => {
  console.log('\nProcess complete.\n');
});
