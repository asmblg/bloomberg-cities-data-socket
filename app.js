require('dotenv').config();
const util = require('util');
const { MongoClient } = require('mongodb');
const {
  updateWithDataArrays,
  updatedWithObject,
  // updateBySubtypeGeoTypeGeoWithValue,
  updateByObjectKeyYearQuarter,
  updateByObjectKeysYearQuarter,
  updateByObjectKeys,
  updateGeoJSONWithDataArrays
} = require('./globalUtils/dataMappers');
const {
  APISocket,
  WebDriverSocket,
  SafeGraphSocket,
  GoogleSheetSocket,
  OneDriveSocket,
} = require('./modules');

const { mergeObjects } = require('./globalUtils/mergeObjects')

// const dataSocketConfigs = require('./configs/scheduled/JLL-XLSX.json')
  // .filter((item, i) =>
  //   i === 5
  // );

const { 
  getDataSocketConfig, 
  // getDbConnection 
} = require('./globalUtils/API');

const run = async () => {
  // Ensure DB URI is present
  if (process.env.MONGODB_URI) {
    // Connect to DB
    const client = await MongoClient.connect(
      process.env.MONGODB_URI,
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log('Connected to DB.')

    const db = client.db(process.env.DATABASE_NAME);
    const dataCollection = db.collection('data');
    const geoCollection = db.collection('geos');
    const socketCollection = db.collection('sockets');

    const socketQuery = {
      scheduleDate: { $lte: new Date('2024-1-1')},
      processedDate: { $exists: false},
      type: "OneDrive",
      fileType: "XLSX",
      project: "Phoenix"
    }

    // Get config array from DB
    const dataSocketConfigs = await getDataSocketConfig(socketCollection, socketQuery);
    console.log(dataSocketConfigs);

    // Execute data socket by data socket type
    for await (config of dataSocketConfigs) {
      try {
        let success = false;
        switch (config.type) {
          // FOR CENSUS
          case 'Census API':
          case 'CensusAPI': {
            const arrayData = await APISocket(config);
            // console.log(arrayData)
            if (config.mapToGeo) {
              // console.log(arrayData);

              const geoJSON = await geoCollection.findOne({
                project: config.project,
                geoType: config.geoType
              });

              // Map arrayData into geoJSON

              const updatedData = updateGeoJSONWithDataArrays({
                arrayData,
                geoJSON,
                joinField: config.joinField,
                mappings: config.mappings
              })
              // console.log('Done!\n', util.inspect(updatedData[0], false, null, true));

              // Update geoJSON on DB
              if (updatedData[0]) {
                await geoCollection.findOneAndUpdate(
                  {
                    project: config.project,
                    geoType: config.geoType
                  },
                  {
                    $set: {
                      features: updatedData,
                      updatedOn: new Date()
                    }
                  }
                );
              }

              console.log('Geos Updated with', config.description)



            } else {
              const dataFromDB = await dataCollection.findOne({
                project: config.project
              });

              const updatedData = await updateWithDataArrays({
                arrayData,
                dataFromDB,
                mappings: config.mappings
              });

              // console.log(updatedData);

              await dataCollection.findOneAndUpdate(
                { project: config.project },
                {
                  $set: {
                    data: updatedData,
                    updatedOn: new Date()
                  }
                }
              );
            }



            // console.log(`Data updated on DB: ${config.description}`)

            break;
          }
          // FOR BLS
          case 'BLS API': {
            const objectArray = await APISocket(config);

            // console.log(util.inspect(objectArray?.filter(({mapping}) => mapping.geo === 'tampa' || mapping.geo === 'phoenix'),false,null,true ))

            for await (obj of objectArray) {
              const dataFromDB = await dataCollection.findOne({
                project: config.project
              });

              const updatedData = await updatedWithObject({
                dataFromDB,
                obj
              });


              await dataCollection.findOneAndUpdate(
                { project: config.project },
                {
                  $set: {
                    data: updatedData.data,
                    updatedOn: new Date()
                  }
                }
              );

              console.log(`Data updated on DB at ${JSON.stringify(obj.mapping)}`)

            };

            console.log(`All data updated on DB for ${config.project}.`)

            break;
          }
          // FOR DATA AXEL
          case 'WebDriver': {
            const obj = await WebDriverSocket(config);

            console.log(util.inspect(obj, false, null, true));

            const dataFromDB = await dataCollection.findOne({
              project: config.project
            });

            const updatedData = config.source === 'JLL'
              ? updateByObjectKeysYearQuarter({
                mapping: config.mapping,
                obj,
                dataFromDB: dataFromDB.data
              })
              : config.source === 'Data Axel'
                ? updateByObjectKeyYearQuarter({
                  mapping: config.mapping,
                  obj,
                  dataFromDB: dataFromDB.data
                })
                : null;

            // console.log('Done!\n', util.inspect(updatedData.realestate.industrial, false, null, true));

            if (updatedData) {
              await dataCollection.findOneAndUpdate(
                { project: config.project },
                {
                  $set: {
                    data: updatedData,
                    updatedOn: new Date()
                  }
                }
              );
            };

            console.log(`Data updated on DB at ${JSON.stringify(config.mapping)}`)

            break;
          }
          // FOR SQUARE
          case 'GoogleSheet': {
            const obj = await GoogleSheetSocket.get(config);

            const dataFromDB = await dataCollection.findOne({
              project: config.project
            });

            const updatedData = updateByObjectKeys({
              mapping: config.mapping,
              obj,
              dataFromDB: dataFromDB.data
            });

            // console.log('Done!\n', util.inspect(updatedData.smallbusiness, false, null, true));


            if (updatedData) {
              await dataCollection.findOneAndUpdate(
                { project: config.project },
                {
                  $set: {
                    data: updatedData,
                    updatedOn: new Date()
                  }
                }
              );
            };

            break;
          }
          // FOR SAFEGRAPH       
          case 'SafeGraph': {
            const data = await SafeGraphSocket({
              dbURI: process.env.SAFEGRAPH_DB_URI,
              ...config
            });

            // console.log('Done!\n', util.inspect(data, false, null, true));


            if (data) {
              const dataFromDB = await dataCollection.findOne({
                project: config.project
              });

              // IMPLEMENT MERGE OBJECTS HERE
              const updatedData = await updatedWithObject({
                dataFromDB,
                obj: {
                  data,
                  mapping: config.dashboardDataUpdate.mapping
                }
              });

              // console.log(util.inspect(updatedData.data.consumers.city.naics3,false,null,true ))

              await dataCollection.findOneAndUpdate(
                { project: config.project },
                {
                  $set: {
                    data: updatedData.data,
                    updatedOn: new Date()
                  }
                }
              );

              console.log(`Data updated on DB at ${JSON.stringify(config.dashboardDataUpdate.mapping)}`)
            };

            break;
          }
          case 'SafeGraph Subareas': {
            const subareaGeoJSON = await geoCollection.findOne({
              project: config.project,
              geoType: config.geoType
            });

            if (subareaGeoJSON.type === 'FeatureCollection' && config.dashboardDataUpdate) {
              for await (feature of subareaGeoJSON.features) {
                const aggregationPipeline = [...config.dashboardDataUpdate.aggregationPipeline]
                const geometry = feature.geometry;
                const name = feature.properties[config.nameField];
                const matchingObject = {
                  "$match": {
                    "geometry": {
                      "$geoWithin": {
                        "$geometry": geometry
                      }
                    }
                  }
                };
                aggregationPipeline.unshift(matchingObject);

                config.dashboardDataUpdate.aggregationPipeline = aggregationPipeline;

                const data = await SafeGraphSocket({
                  dbURI: process.env.SAFEGRAPH_DB_URI,
                  ...config
                });

                config.dashboardDataUpdate.aggregationPipeline = aggregationPipeline.slice(1);

                if (data) {
                  const dataFromDB = await dataCollection.findOne({
                    project: config.project
                  });

                  config.dashboardDataUpdate.mapping.geo = name;

                  // IMPLEMENT MERGE OBJECTS IN THE MODULE BELOW
                  const updatedData = await updatedWithObject({
                    dataFromDB,
                    obj: {
                      data,
                      mapping: config.dashboardDataUpdate.mapping
                    }
                  });

                  await dataCollection.findOneAndUpdate(
                    { project: config.project },
                    {
                      $set: {
                        data: updatedData.data,
                        updatedOn: new Date()
                      }
                    }
                  );

                  console.log(`Data updated on DB at ${JSON.stringify(config.dashboardDataUpdate.mapping)}`)

                }
              }
            }
            break;
          }
          // FOR JLL, ALIGNABLE, DEALROOM, and LIGHTCAST -- ALIGNABLE PDF IN DEVELOPMENT
          case 'OneDrive': {
            config.clientID = process.env.MS_CLIENT_ID;
            config.clientSecret = process.env.MS_CLIENT_SECRET;
            const data = await OneDriveSocket(config);
            // console.log(util.inspect(data, false, null, true));

            const { mappings } = config;

            if (data) {
              if (config.mapToGeo) {

                const geoJSON = await geoCollection.findOne({
                  project: config.project,
                  geoType: config.geoType
                });

                const features = geoJSON?.features;
                const updatedFeatures = features?.map(feature => {
                  const joinKey = feature.properties[config.joinField];
                  mappings.forEach(({ destination: { indicator } }) => {
                    const value = data?.[indicator]?.[joinKey] || null
                    feature.properties[indicator] = value;
                  })
                  return feature;
                })

                if (updatedFeatures[0]) {
                  await geoCollection.findOneAndUpdate(
                    {
                      project: config.project,
                      geoType: config.geoType
                    },
                    {
                      $set: {
                        features: updatedFeatures,
                        updatedOn: new Date()
                      }
                    }
                  );
                }

              } else {
                let result = null;
                const { data: dbData } = await dataCollection.findOne({
                  project: config.project
                });

                mappings.forEach(({
                  destination: {
                    category,
                    geo,
                    section,
                    keysAreGeos,
                    indicator
                  }
                }) => {
                  const target = dbData;

                  let source = {
                    [category]: {}
                  };

                  if (keysAreGeos) {
                    // console.log(util.inspect(data, false, null, true));
                    
                    if (!source[category][section]) {
                      source[category][section] = {}; 
                    }

                    if ( (!source[category][section][geo])) {
                      source[category][section][geo] = {}; 
                    }

                    // Object.entries(data).forEach(([indicatorKey, dataObject], i) =>
                      Object.entries(data?.[indicator] || {}).forEach(([key, value]) => {
                        const geoKey = config?.geoManifest?.[key] || key;
                        source[category][section][geo][geoKey] = {
                          [indicator] : value
                        }

                        // if (i === 0) {
                        //   source[category][geo][geoKey] = {};
                        //   source[category][geo][geoKey][indicatorKey] = {}
                        // }
                        // source[category][geo][geoKey][indicatorKey] = value
                      })
                    // )
                  } else {

                    if (geo) {
                      if (!source[category][geo]) {
                        source[category][geo] = {}
                      }
                      if (section) {
                        source[category][geo][section] = data
                      } else {
                        source[category][geo] = data
                      }
                    };
                  }

                  result = mergeObjects(result ? result : target, source)
                })

                if (result) {

                  await dataCollection.findOneAndUpdate(
                    {project: config.project }, 
                    {
                      $set: {
                        data: result,
                        updatedOn: new Date()
                      }
                    }
                  );                
                }
              }

              console.log(`Data updated on DB at ${mappings.map(({destination}) => `${config.project}: ${JSON.stringify(destination)}`)}`)

            }

            break;
          }

          default: {
            console.log(config.type, 'Data Socket Unsupported:', config.description);
            break;
          }
        }

        // HANDLE SOCKET CONFIG
        if (success) {
          

        }
      } catch (err) {
        console.log(err);

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


// BACKUP FOR JLL
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