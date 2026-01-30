const fs = require('fs').promises;
const path = require('path');
const configName = 'Dealroom-Company-List';
const templates = require(`./configs/templates/${configName}.json`);
const projects = ['lisboa']// ['Phoenix', 'Tampa', 'Baltimore']
const dates = [
  '2024-04-15',
  '2024-07-15',
  '2024-10-15',
  '2025-01-15',
  '2025-04-15',
  '2025-07-15',
  '2025-10-15',
  '2026-01-15'
];
// const partitionDate = ['2023-10-1', '2024-1-1', '2024-4-1', '2024-7-1', '2024-10-1', '2025-1-1', '2025-4-1', '2025-7-1', '2025-10-1'];


function handleMapping(template, obj) {
  const modObj = { ...template };
  // console.log(modObj);
  Object.entries(obj).forEach(([key, value]) => {
    // if (typeof value === 'string') {
    modObj[key] = value;
    // }
    // else if (Array.isArray(value)) {
    //     // CODE TO HANDLE ARRAY
    // } else if (Object.keys(value)?.[0]) {
    //     Object.entries(value).forEach(([nestKey, nestValue]) =>
    //         modObj[key][nestKey] = nestValue
    //        // console.log(modObj, key, nestKey, nestValue)
    //     );
    // } 
  });
  return modObj;
};

function mapTemplate(configArray, templates) {
  const array = [];
  templates.forEach(template =>
    configArray.forEach(obj => {
      const modObj = handleMapping(template, obj);
      array.push(modObj);
    })
  );
  return array;
};

function arrayLast12Months(startDate) {
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  let date = new Date(startDate);
  let result = [];
  date.setMonth(date.getMonth() - 1);

  for (let i = 0; i < 12; i++) {
      let month = months[date.getMonth()];
      let year = date.getFullYear();
      result.unshift(`${month}/${year}`);
      date.setMonth(date.getMonth() - 1);
  }

  return result;}

const configArray = [];

projects.forEach(project => 
  dates.forEach((date, i) => {
    //const scheduleDate = new Date(date);
    // const partitionKeyAfter = partitionDate[index];
  
    configArray.push({
      "project": project,
      "scheduleDate": date,
      //For Dealroom Company Lists
      "mappings": [
        {
          "destination": {
            "geo": "city",
            "category": "capital",
            "indicator": "industry_list"
          },
          "origin" : {
            "groupField": "INDUSTRIES",
            "groupValueSplitter": ";",
            "filter": {
              "field": "HQ CITY",
              "value": `${project}`
            },
            "filter2": {
              "field": "LAST FUNDING DATE",
              "values": [...arrayLast12Months(date)]
            },
            "endSearch" : "",
            "excludeKeys": []
          } 
        }
      ] 
      //For Raw Places
      // "rawDataUpdateConfig": {
      //   "dbName": "safegraph",
      //   "collectionName": "places",
      //   "sourceDirectory": `API-${date}`,
      //   "updateQueryFields": ["placekey"],
      //   "apiURL": "https://app.deweydata.io/external-api/v3/products/38da1cee-ff50-40f7-b04c-c26f9c384542/files",
      //   "tempDir": "./data/safegraph/places/",
      //   "fileType": ".csv",
      //   "filters" : [
      //     {
      //       "city": "Tampa",
      //       "region": "FL",
      //       "iso_country_code": "US"
      //     },
      //     {
      //       "city": "Phoenix",
      //       "region": "AZ",
      //       "iso_country_code": "US"
      //     },
      //     {
      //       "city": "Baltimore",
      //       "region": "MD",
      //       "iso_country_code": "US"
      //     }
      //   ]
      // }
  
      //For Raw Transactions
      // "rawDataUpdateConfig": {
      //   "dbName": "safegraph",
      //   "collectionName": "spend",
      //   "fileType": ".csv.gz",
      //   "apiURL": "https://app.deweydata.io/external-api/v3/products/eb6e748a-0fdd-4bc7-9dd7-bbed0890948d/files",
      //   "tempDir": "./data/safegraph/spending/",
      //   "params": {
      //     "partition_key_after": `${partitionDate[i]}`
      //   }
      // }
    });
  }))


async function writeConfigFile(configName, configArray, templates) {
  const result = mapTemplate(configArray, templates);
  const dirName = `${configName}`;
  const dirPath = path.join('./configs/schedule', dirName);

  try {
    await fs.mkdir(dirPath, { recursive: true });
    // console.log('Directory created successfully:', dirPath);

    const fileName = `${configName}.json`;
    const filePath = path.join(dirPath, fileName);

    await fs.writeFile(filePath, '[\n');

    for (let i = 0; i < result.length; i++) {
      const obj = result[i];
      const dataString = JSON.stringify(obj) + (i < result.length - 1 ? ',\n' : '\n');
      await fs.appendFile(filePath, dataString);
    }

    await fs.appendFile(filePath, ']');

    return `File save to ${filePath}`

  } catch (err) {
    console.error('Error:', err);
  }
}

// Call the function with your parameters
writeConfigFile(configName, configArray, templates).then(message =>
  console.log(message)
);

// console.log(configArray.map(({scheduleDate, rawDataUpdateConfig : {sourceDirectory}}) => `${scheduleDate} *** ${sourceDirectory}`))
// const result = mapTemplate(configArray, templates);

// const dirName = `${configName}`;
// const dirPath = `./configs/schedule/${dirName}`;

// fs.mkdir(dirPath, { recursive: true }, (err) => {
//     if (err) {
//         console.error('Error creating directory:', err);
//         return;
//     }

//     console.log('Directory created successfully:', dirPath);
//     const fileName = `${configName}.json`;
//     const filePath = path.join(dirPath, fileName);

//     fs.writeFile(filePath, '[\n', (err) => {
//         if (err) {
//             console.error('Error writing file:', err);
//             return;
//         }

//         // Append each object
//         result.forEach((obj, i) => {
//             fs.appendFile(filePath, JSON.stringify(obj) + (i < result.length - 1 ? ',\n' : '\n'), err => {
//                 if (err) {
//                     console.error('Error appending file:', err);
//                     return;
//                 }

//                 // After the last object, append the closing bracket
//                 if (i === result.length - 1) {
//                     fs.appendFile(filePath, ']', err => {
//                         if (err) {
//                             console.error('Error appending closing bracket:', err);
//                         }
//                     });
//                 }
//             });
//         });
//     });
// });
