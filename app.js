require('dotenv').config();
const { MongoClient } = require('mongodb');
const _ = require('lodash');
const {
  updateWithDataArrays,
  updatedWithObject,
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
      scheduleDate: { $lte: new Date() },
      processedDate: { $exists: false },
      // type: "SafeGraph",
      // rawDataUpdateConfig: {$exists: true}
      // fileType: "XLSX",
      // project: "Phoenix"
    }


    // Get config array from DB
    const dataSocketConfigs = await getDataSocketConfig(socketCollection, socketQuery)

    console.log('Number of Sockets to Run:', dataSocketConfigs.length)

    // const dataSocketConfigs = [
    //   {
    //     "project": "Tampa",
    //     "type": "CensusAPI",
    //     "scheduleDate": {
    //       "$date": "2024-01-15T00:00:00.000Z"
    //     },
    //     "url": "https://api.census.gov/data/2022/acs/acs1/subject",
    //     "query": {
    //       "get": "NAME,S0801_C01_013E",
    //       "for": "place:71000",
    //       "in": "state:12"
    //     },
    //     "source": "ACS 1-year 2022",
    //     "description": "Remote Workers in City of Tampa from 2022 Subject Table",
    //     "tableDescription": "Subject Tables",
    //     "mappings": [
    //       {
    //         "destination": {
    //           "geo": "city",
    //           "category": "jobs",
    //           "year": "2022",
    //           "indicator": "remote_workers"
    //         },
    //         "origin": {
    //           "valueIndex": "S0801_C01_013E"
    //         }
    //       }
    //     ]
    //   },
    //   {
    //     "project": "Phoenix",
    //     "type": "CensusAPI",
    //     "scheduleDate": {
    //       "$date": "2024-01-15T00:00:00.000Z"
    //     },
    //     "url": "https://api.census.gov/data/2022/acs/acs1/subject",
    //     "query": {
    //       "get": "NAME,S0801_C01_013E",
    //       "for": "place:55000",
    //       "in": "state:04"
    //     },
    //     "source": "ACS 1-year 2022",
    //     "description": "Remote Workers in City of Phoenix from 2022 Subject Table",
    //     "tableDescription": "Subject Tables",
    //     "mappings": [
    //       {
    //         "destination": {
    //           "geo": "city",
    //           "category": "jobs",
    //           "year": "2022",
    //           "indicator": "remote_workers"
    //         },
    //         "origin": {
    //           "valueIndex": "S0801_C01_013E"
    //         }
    //       }
    //     ]
    //   },
    //   {
    //     "project": "Baltimore",
    //     "type": "CensusAPI",
    //     "scheduleDate": {
    //       "$date": "2024-01-15T00:00:00.000Z"
    //     },
    //     "url": "https://api.census.gov/data/2022/acs/acs1/subject",
    //     "query": {
    //       "get": "NAME,S0801_C01_013E",
    //       "for": "place:04000",
    //       "in": "state:24"
    //     },
    //     "source": "ACS 1-year 2022",
    //     "description": "Remote Workers in City of Baltimore from 2022 Subject Table",
    //     "tableDescription": "Subject Tables",
    //     "mappings": [
    //       {
    //         "destination": {
    //           "geo": "city",
    //           "category": "jobs",
    //           "year": "2022",
    //           "indicator": "remote_workers"
    //         },
    //         "origin": {
    //           "valueIndex": "S0801_C01_013E"
    //         }
    //       }
    //     ]
    //   }
    // ]


    // Execute data socket by data socket type
    for await (config of dataSocketConfigs.sort((a, b) => {
      if (a.runFirst && !b.runFirst) {
        return -1;
      }
      else if (b.runFirst && !a.runFirst) {
        return 1;
      }
      return 0;
    })) {

      let updatedData = null;

      const dataFromDB = await dataCollection.findOne({
        project: config.project
      });

      try {
        switch (config.type) {
          // FOR CENSUS
          case 'Census API':
          case 'CensusAPI': {
            const arrayData = await APISocket(config);

            if (config.mapToGeo) {

              const geoJSON = await geoCollection.findOne({
                project: config.project,
                geoType: config.geoType
              });

              const updatedGeoFeatures = updateGeoJSONWithDataArrays({
                arrayData,
                geoJSON,
                joinField: config.joinField,
                mappings: config.mappings
              });

              if (updatedGeoFeatures[0]) {
                await geoCollection.findOneAndUpdate(
                  {
                    project: config.project,
                    geoType: config.geoType
                  },
                  {
                    $set: {
                      features: updatedGeoFeatures,
                      updatedOn: new Date()
                    }
                  }
                );
              }

            } else {

              updatedData = await updateWithDataArrays({
                arrayData,
                dataFromDB,
                mappings: config.mappings
              });

            }

            break;
          }
          // FOR BLS
          case 'BLS API': {
            const objectArray = await APISocket(config);
            // console.log(objectArray)

            objectArray.forEach(obj =>
              updatedData = updatedWithObject({
                dataFromDB: {
                  data: updatedData
                    ? updatedData
                    : structuredClone(dataFromDB.data)
                },
                obj
              })
            )

            break;
          }
          // FOR DATA AXEL
          case 'WebDriver': {
            const obj = await WebDriverSocket(config);

            updatedData = config.source === 'JLL'
              ? updateByObjectKeysYearQuarter({
                mapping: config.mapping,
                obj,
                dataFromDB: structuredClone(dataFromDB.data)
              })
              : config.source === 'Data Axel'
                ? updateByObjectKeyYearQuarter({
                  mapping: config.mapping,
                  obj,
                  dataFromDB: structuredClone(dataFromDB.data)
                })
                : null;

            break;
          }
          // FOR SQUARE
          case 'GoogleSheet': {
            const obj = await GoogleSheetSocket.get(config);

            updatedData = updateByObjectKeys({
              mapping: config.mapping,
              obj,
              dataFromDB: structuredClone(dataFromDB.data)
            });

            break;
          }
          // FOR SAFEGRAPH       
          case 'SafeGraph': {
            const data = await SafeGraphSocket({
              dbURI: process.env.SAFEGRAPH_DB_URI,
              ...config
            });

            if (data) {

              updatedData = await updatedWithObject({
                dataFromDB: structuredClone(dataFromDB),
                obj: {
                  data,
                  mapping: config.dashboardDataUpdate.mapping
                }
              });

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

                  config.dashboardDataUpdate.mapping.geo = name;

                  updatedData = await updatedWithObject({
                    dataFromDB: updatedData
                      ? { data: updatedData }
                      : structuredClone(dataFromDB),
                    obj: {
                      data,
                      mapping: config.dashboardDataUpdate.mapping
                    }
                  });

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

                mappings.forEach(({
                  destination: {
                    category,
                    geo,
                    section,
                    keysAreGeos,
                    indicator
                  }
                }) => {

                  let source = {
                    [category]: {}
                  };

                  if (keysAreGeos) {
                    // console.log(util.inspect(data, false, null, true));

                    if (!source[category][section]) {
                      source[category][section] = {};
                    }

                    if ((!source[category][section][geo])) {
                      source[category][section][geo] = {};
                    }

                    // Object.entries(data).forEach(([indicatorKey, dataObject], i) =>
                    Object.entries(data?.[indicator] || {}).forEach(([key, value]) => {
                      const geoKey = config?.geoManifest?.[key] || key;
                      source[category][section][geo][geoKey] = {
                        [indicator]: value
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

                  updatedData = mergeObjects(
                    updatedData
                      ? updatedData
                      : structuredClone(dataFromDB.data),
                    source
                  )
                })
              }
            }

            break;
          }

          case 'Direct': {
            console.log(config.type, 'Direct Update', config.update);
            break;
          }

          default: {
            console.log(config.type, 'Data Socket Unsupported:', config.description);
            break;
          }
        }

        if (
          (updatedData && !_.isEqual(updatedData, dataFromDB.data)) ||
          (config.type === 'Direct' && config.update)
        ) {
          console.log('NEW DATA');
          const updateObject = config.type === 'Direct'
            ? {
              ...config.update,
              updatedOn: new Date()
            }
            : {
              data: updatedData,
              updatedOn: new Date()
            }

          await dataCollection.findOneAndUpdate(
            { project: config.project },
            { $set: updateObject }
          )
          await socketCollection.findOneAndUpdate(
            { _id: config._id },
            { $set: { processedDate: new Date() } }
          )

          // HANDLE SOCKET CONFIG UPDATE
        } else if (updatedData) {
          console.log(config._id, 'NO NEW DATA')
          // HANDLE NO NEW DATA
        } else {
          console.log(config._id, config?.mapToGeo ? 'MAPPPED TO GEO' : 'NO DATA')
          // HANDLE NO DATA
          if (config?.mapToGeo) {
            await socketCollection.findOneAndUpdate(
              { _id: config._id },
              { $set: { processedDate: new Date() } }
            )
          }
        }

      } catch (err) {
        const errorObject = {
          socketID: config?._id,
          error: err,
          date: new Date()
        };
        // INSERT IN ERROR COLLECTION  
        console.log(config._id, errorObject);
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