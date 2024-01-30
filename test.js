// const {parsePDFviaLink} = require('./modules/WebDriverSocket/utils');
require('dotenv').config();
const fs = require('fs');
const {APISocket, XLSXSocket, WebDriverSocket, GoogleSheetSocket} = require('./modules');
const {Navigate, parsePDFviaLink, parseTextFromImage} = require('./modules/WebDriverSocket/utils');
const { getDbConnection } = require('./globalUtils/API');
const devConfigs = require('./modules/XLSXSocket/devConfigs.json')
const Tesseract = require('tesseract.js');

const runTest = async () => {

  // await GoogleSheetSocket.get({
  //   sheetID: '1djuhHFxxXJTsdqrN43pie7m2UWUcx8GtG40vVbOK17c',
  //   range: "Phoenix!M:W"
  // })

  const seriesIDs = [
    "LAUMT131206000000005",
    "LAUMT481242000000005",
    "LAUMT371674000000005",
    "LAUMT081974000000005",
    "LAUMT123674000000005",
    "LAUMT124530000000005",
    "LAUMT131206000000003",
    "LAUMT481242000000003",
    "LAUMT371674000000003",
    "LAUMT081974000000003",
    "LAUMT123674000000003",
    "LAUMT124530000000003",
    "SMU13120602000000001",
    "SMU12367402000000001",
    "SMU12453002000000001",
    "SMU13120606500000001",
    "SMU48124206500000001",
    "SMU37167406500000001",
    "SMU08197406500000001",
    "SMU12367406500000001",
    "SMU12453006500000001",
    "SMU13120605500000001",
    "SMU48124205500000001",
    "SMU37167405500000001",
    "SMU08197405500000001",
    "SMU12367405500000001",
    "SMU12453005500000001",
    "SMU13120609000000001",
    "SMU48124209000000001",
    "SMU37167409000000001",
    "SMU08197409000000001",
    "SMU12367409000000001",
    "SMU12453009000000001",
    "SMU13120605000000001",
    "SMU48124205000000001",
    "SMU37167405000000001",
    "SMU08197405000000001",
    "SMU12367405000000001",
    "SMU12453005000000001",
    "SMU13120607000000001",
    "SMU48124207000000001",
    "SMU37167407000000001",
    "SMU08197407000000001",
    "SMU12367407000000001",
    "SMU12453007000000001",
    "SMU13120603000000001",
    "SMU48124203000000001",
    "SMU37167403000000001",
    "SMU08197403000000001",
    "SMU12367403000000001",
    "SMU12453003000000001",
    "SMU13120601000000001",
    "SMU12367401000000001",
    "SMU12453001000000001",
    "SMU48124201500000001",
    "SMU37167401500000001",
    "SMU08197401500000001",
    "SMU13120608000000001",
    "SMU48124208000000001",
    "SMU37167408000000001",
    "SMU08197408000000001",
    "SMU12367408000000001",
    "SMU12453008000000001",
    "SMU13120606000000001",
    "SMU48124206000000001",
    "SMU37167406000000001",
    "SMU08197406000000001",
    "SMU12367406000000001",
    "SMU12453006000000001",
    "SMU13120604000000001",
    "SMU48124204000000001",
    "SMU37167404000000001",
    "SMU08197404000000001",
    "SMU12367404000000001",
    "SMU12453004000000001"
  ];


await new Promise(resolve => 
  fs.appendFile(
    './devConfigss/tableConfigs-Tampa.json', 
    '[', 
    err => {
      if (err) {
        console.log(err)
      }
      resolve()
    }
  )
)

const catalogs = await APISocket({
  type: 'BLS API',
  url: "https://api.bls.gov/publicAPI/v2/timeseries/data/",
  tables: seriesIDs
});


for await ({series_id, series_title, area} of catalogs) {

  // Map Area Labels to key on DB
  const areaMapping = {
    'Austin-Round Rock, TX Metropolitan Statistical Area' : 'austin'
  }
  

  const configObj = {
    // "project": "Phoenix",
    // "type": "BLS API",
    // "url": "https://api.bls.gov/publicAPI/v2/timeseries/data/",
    "seriesID": series_id,
    // "source": "BLS",
    "description": series_title,
    // "tableDescription": "Monthly Time Series",
    // "frequency": "monthly",
    "area": area,
    "mapping": null
  };

  await new Promise(resolve => 
    fs.appendFile(
      './devConfigss/tableConfigs-Tampa.json', 
      JSON.stringify(configObj) + ',', 
      err => {
        if (err) {
          console.log(err)
        }
        resolve(console.log(series_id, 'appended.'))
      }
    )
  )



};

await new Promise(resolve => 
  fs.appendFile(
    './devConfigss/tableConfigs-Tampa.json', 
    ']', 
    err => {
      if (err) {
        console.log(err)
      }
      resolve()
    }
  )
)

// fs.writeFile('./devConfigss/blsAPI-Phoenix.json', content, 'utf8', err => {
//   if (err) {
//     return console.log(err)
//   }
//   console.log('File Saved!');
// })




  // const tablePage = 2;
  // const year = 2021;
  // const quarter = 'q4';
  // const city = 'tampa-bay';
  // const project = 'Tampa';
  // const rowSearch = 'Tampa CBD Totals';
  // const valueIndex = 7;

  // await parsePDFviaLink({
  //   link: `https://www.us.jll.com/content/dam/jll-com/documents/pdf/research/americas/us/${quarter}-${year}-office-insights/jll-us-office-insight-${quarter}-${year}-${city}.pdf`, 
  //   project: project, 
  //   tablePage: tablePage
  // });

  // await parseTextFromImage({
  //   imagePath : `./data/pdfparse/page-${tablePage}.png`,
  //   rowSearch: rowSearch,
  //   valueIndex: valueIndex  
  // });


  // await Tesseract.recognize(
  //   './data/pdfparse/page-5.png',
  //   'eng',
  //   // { logger: m => console.log(m) }
  // ).then(({ data: { text } }) => {
  //   console.log(text);
  // })


  // if (process.env.MONGODB_URI) {

  //   const db = await getDbConnection(process.env.MONGODB_URI);
  //   // Get config array from DB
  //   // const dataSocketConfig = await getDataSocketConfig(db);

  //   for await (configObj of devConfigs) {
  //     await XLSXSocket({
  //       ...configObj,
  //       clientID: process.env.MS_CLIENT_ID,
  //       clientSecret: process.env.MS_CLIENT_SECRET,
  //       db: db
  //     });
  //   }
  // }
};

runTest().then(() => process.exit(0))