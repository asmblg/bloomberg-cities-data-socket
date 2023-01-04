const { CensusAPISocket, WebDriverSocket } = require('./modules');
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
      case 'AYWebDriver': {
        await WebDriverSocket.OfficeMarket('https://www.avisonyoung.us/web/phoenix/office-market-report')
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
