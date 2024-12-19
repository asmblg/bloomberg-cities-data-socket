require('dotenv').config();
const { MongoClient } = require('mongodb');
const _ = require('lodash');
const util = require('util');
const {
  updateWithDataArrays,
  updatedWithObject,
  updateByObjectKeyYearQuarter,
  updateByObjectKeysYearQuarter,
  updateByObjectKeys,
  updateGeoJSONWithDataArrays,
  excelDateToJSDate
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
      deactivated: { $exists: false },
      // source: 'Lightcast'
      // source: 'Alignable'
      // type: "BLS API"
      // type: "SafeGraph Subareas",
      // fileName: 'JLL_Q32024'
      // rawDataUpdateConfig: {$exists: true}
      // fileType: "XLSX",
      // project: "Phoenix"
    }


    // Get config array from DB
    const dataSocketConfigs = await getDataSocketConfig(socketCollection, socketQuery);
    // const dataSocketConfigs = [
    //   {
    //     "project": "Phoenix",
    //     "type": "OneDrive",
    //     "scheduleDate": "2024-12-15",
    //     "fileType": "XLSX",
    //     "source": "GUSTO",
    //     "directoryID": "01E52WSOXGKJC7O23LOVAYBR7SEUA2DDYB",
    //     "fileName": "Economic Trends_data",
    //     "description": "GUSTO Economic Trends Data for Phoenix Q3 2024",
    //     "sheetName": "Economic Trends_data",
    //     "mappings": [
    //       {
    //         "destination": {
    //           "geo": "city",
    //           "category": "smallbusiness",
    //           "indicator": "p_hire",
    //           "labelCalc": "numToDate",
    //           "groupCalc": "quarterAvg"
    //         },
    //         "origin": {
    //           "labelField": "Date",
    //           "valueField": "Avg. Metric Percentage",
    //           "filter": {
    //             "field": "Metrics",
    //             "value": "Hire %"
    //           },
    //           "filter2": {
    //             "field": "Dimension Description",
    //             "value": "Phoenix, AZ"
    //           }
    //         }
    //       },
    //       {
    //         "destination": {
    //           "geo": "city",
    //           "category": "smallbusiness",
    //           "indicator": "p_termination",
    //           "labelCalc": "numToDate",
    //           "groupCalc": "quarterAvg"

    //         },
    //         "origin": {
    //           "labelField": "Date",
    //           "valueField": "Avg. Metric Percentage",
    //           "filter": {
    //             "field": "Metrics",
    //             "value": "Termination %"
    //           },
    //           "filter2": {
    //             "field": "Dimension Description",
    //             "value": "Phoenix, AZ"
    //           }
    //         }
    //       }
    //     ]
    //   },
    //   {
    //     "project": "Baltimore",
    //     "type": "OneDrive",
    //     "scheduleDate": "2024-12-15",
    //     "fileType": "XLSX",
    //     "source": "GUSTO",
    //     "directoryID": "01E52WSOXGKJC7O23LOVAYBR7SEUA2DDYB",
    //     "fileName": "Economic Trends_data",
    //     "description": "GUSTO Economic Trends Data for Baltimore Q3 2024",
    //     "sheetName": "Economic Trends_data",
    //     "mappings": [
    //       {
    //         "destination": {
    //           "geo": "city",
    //           "category": "smallbusiness",
    //           "indicator": "p_hire",
    //           "labelCalc": "numToDate",
    //           "groupCalc": "quarterAvg"
    //         },
    //         "origin": {
    //           "labelField": "Date",
    //           "valueField": "Avg. Metric Percentage",
    //           "filter": {
    //             "field": "Metrics",
    //             "value": "Hire %"
    //           },
    //           "filter2": {
    //             "field": "Dimension Description",
    //             "value": "Baltimore, MD"
    //           }
    //         }
    //       },
    //       {
    //         "destination": {
    //           "geo": "city",
    //           "category": "smallbusiness",
    //           "indicator": "p_termination",
    //           "labelCalc": "numToDate",
    //           "groupCalc": "quarterAvg"

    //         },
    //         "origin": {
    //           "labelField": "Date",
    //           "valueField": "Avg. Metric Percentage",
    //           "filter": {
    //             "field": "Metrics",
    //             "value": "Termination %"
    //           },
    //           "filter2": {
    //             "field": "Dimension Description",
    //             "value": "Baltimore, MD"
    //           }
    //         }
    //       }
    //     ]
    //   },
    //   {
    //     "project": "Tampa",
    //     "type": "OneDrive",
    //     "scheduleDate": "2024-12-15",
    //     "fileType": "XLSX",
    //     "source": "GUSTO",
    //     "directoryID": "01E52WSOXGKJC7O23LOVAYBR7SEUA2DDYB",
    //     "fileName": "Economic Trends_data",
    //     "description": "GUSTO Economic Trends Data for Tampa Q3 2024",
    //     "sheetName": "Economic Trends_data",
    //     "mappings": [
    //       {
    //         "destination": {
    //           "geo": "city",
    //           "category": "smallbusiness",
    //           "indicator": "p_hire",
    //           "labelCalc": "numToDate",
    //           "groupCalc": "quarterAvg"
    //         },
    //         "origin": {
    //           "labelField": "Date",
    //           "valueField": "Avg. Metric Percentage",
    //           "filter": {
    //             "field": "Metrics",
    //             "value": "Hire %"
    //           },
    //           "filter2": {
    //             "field": "Dimension Description",
    //             "value": "Tampa, FL"
    //           }
    //         }
    //       },
    //       {
    //         "destination": {
    //           "geo": "city",
    //           "category": "smallbusiness",
    //           "indicator": "p_termination",
    //           "labelCalc": "numToDate",
    //           "groupCalc": "quarterAvg"

    //         },
    //         "origin": {
    //           "labelField": "Date",
    //           "valueField": "Avg. Metric Percentage",
    //           "filter": {
    //             "field": "Metrics",
    //             "value": "Termination %"
    //           },
    //           "filter2": {
    //             "field": "Dimension Description",
    //             "value": "Tampa, FL"
    //           }
    //         }
    //       }
    //     ]
    //   }
    // ]

    console.log('Number of Sockets to Run:', dataSocketConfigs.length)

    // Execute data socket by data socket type
    for await (config of dataSocketConfigs
      // .filter((obj, i) => i === 0)
      .sort((a, b) => {
        if (a.runFirst && !b.runFirst) {
          return -1;
        }
        else if (b.runFirst && !a.runFirst) {
          return 1;
        }
        else if (a.runLast && !b.runLast) {
          return 1;
        }
        else if (b.runLast && !a.runLast) {
          return -1;
        }
        else {
          return 0;
        }
      })) {

      let updatedData = null;

      const dataFromDB = config?.project
        ? await dataCollection.findOne({
          project: config.project
        })
        : {};



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

              const {
                section,
                geotype,
                category,
                indicator
              } = config.dashboardDataUpdate.mapping;

              // console.log('DATA FROM DB', dataFromDB.data[section][geotype][category][indicator]);

              updatedData = mergeObjects(
                structuredClone(dataFromDB.data),
                {
                  [section]: {
                    [geotype]: {
                      [category]: {
                        [indicator]: { ...data }
                      }
                    }
                  }
                }
              )

              // updatedData = await updatedWithObject({
              //   dataFromDB: structuredClone(dataFromDB),
              //   obj: {
              //     data,
              //     mapping: config.dashboardDataUpdate.mapping
              //   }
              // });

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

                  // config.dashboardDataUpdate.mapping.geo = name;

                  const { section, geotype, category, indicator } = config.dashboardDataUpdate.mapping;

                  updatedData = mergeObjects(
                    updatedData
                      ? { ...updatedData }
                      : structuredClone(dataFromDB.data),
                    {
                      [section]: {
                        [geotype]: {
                          [name]: {
                            [category]: {
                              [indicator]: { ...data }
                            }
                          }
                        }
                      }
                    }
                  )

                  // updatedData = await updatedWithObject({
                  //   dataFromDB: updatedData
                  //     ? { data: updatedData }
                  //     : structuredClone(dataFromDB),
                  //   obj: {
                  //     data,
                  //     mapping: config.dashboardDataUpdate.mapping
                  //   }
                  // });

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

            // console.log(data)

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
                    indicator,
                    labelCalc,
                    groupCalc
                  }
                }) => {

                  let source = {
                    [category]: {}
                  };

                  if (labelCalc === 'numToDate') {
                    Object.keys(data[indicator]).forEach(key => {
                      const dateKey = excelDateToJSDate(key)
                      data[indicator][dateKey] = data[indicator][key]
                      delete data[indicator][key]
                    })
                  }

                  if (groupCalc === 'quarterAvg') {
                    const quarterData = {};
                    Object.entries(data[indicator]).forEach(([key, value]) => {
                      const date = new Date(key);
                      const quarter = Math.floor((date.getMonth() + 3) / 3);
                      const year = date.getFullYear();
                      const quarterKey = `${year}-Q${quarter}`;
                      if (!quarterData[quarterKey]) {
                        quarterData[quarterKey] = [];
                      }
                      quarterData[quarterKey].push(value);
                    });

                    Object.entries(quarterData).forEach(([key, value]) => {
                      if (value.length === 3) {
                      const sum = value.reduce((acc, curr) => acc + curr, 0);
                      const avg = sum / value.length;
                      data[indicator][key] = avg;
                      }
                    });
                    Object.keys(data[indicator]).forEach(key => {
                      if (key.search('Q') === -1) {
                        delete data[indicator][key];
                      }
                    } )
                  }

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
                        if (!source[category][geo][section]) {
                          source[category][geo][section] = {}
                        }
                        source[category][geo][section][indicator] = data[indicator]
                      } else {
                        if (!source[category][geo]) {
                          source[category][geo] = {}
                        }
                        source[category][geo][indicator] = data[indicator]
                      }
                    };
                  }

                  // console.log('SOURCE', util.inspect(source, false, null, true));

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

          // Directly Inserts Data Into Designated Location
          case 'Direct': {
            console.log(config.type, 'Direct Update', config.update);
            updatedData = mergeObjects(
              structuredClone(dataFromDB.data),
              config.update
            )
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
          const updateObject = {
            data: updatedData,
            updatedOn: new Date()
          }

          // config.type === 'Direct'
          //   ? {
          //     ...config.update,
          //     updatedOn: new Date()
          //   }
          //   : {
          //     data: updatedData,
          //     updatedOn: new Date()
          //   }

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