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
  AWS_S3_Sync
} = require('./modules');

const { mergeObjects } = require('./globalUtils/mergeObjects')

const createNestedObject = (keys, value) => {
  if (keys.length === 1) {
    return { [keys[0]]: value };
  }
  return { [keys[0]]: createNestedObject(keys.slice(1), value) };
}
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
      // runFirst: true
      // source: 'Alignable',
      // source: 'Alignable'
      // source: "JLL"
      // type: "SafeGraph Subareas",
      // fileName: 'JLL_Q32024'
      // rawDataUpdateConfig: {$exists: true}
      // fileType: "XLSX",
      // project: "Phoenix"
    }


    // Get config array from DB
    const dataSocketConfigs = !process.env.LOCAL_SOCKET_PATH
      ? await getDataSocketConfig(socketCollection, socketQuery)
      : require(process.env.LOCAL_SOCKET_PATH);

    console.log('Number of Sockets to Run:', dataSocketConfigs.length)

    // Execute data socket by data socket type
    for await (config of dataSocketConfigs
      // .filter((obj, i) => i === 2)
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
        }).then(data => data || { data: {} })
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
                ).then(() => console.log('Done!'))
                  .catch(err => console.log(err));
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

            } else if (config.rawDataUpdate) {
              console.log('Done!')
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
            // console.log('ONE DRIVE DATA', util.inspect(data, false, null, true));

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
                  ).then(() => console.log('Done!'))
                    .catch(err => console.log(err));
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
                    groupCalc,
                    year,
                    overwriteAt
                  }
                }) => {

                  let source = category || section
                    ? {
                      [category || section]: {}
                    }
                    : {};

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
                    })
                  }

                  if (keysAreGeos) {

                    if (keysAreGeos?.basePath && keysAreGeos?.indicatorPath) {
                      const indicatorsObject = {}

                      Object.values(data).forEach(object => {
                        Object.entries(object).forEach(([key, value]) => {
                          const indicatorKeys = keysAreGeos.indicatorPath.split('.');
                          const indicatorObject = createNestedObject(indicatorKeys, value);
                          indicatorsObject[key] = indicatorObject;
                        })
                      })

                      if (keysAreGeos?.total?.label) {
                        const total = {};
                        // console.log('INDICATORS OBJECT', util.inspect(indicatorsObject, false, null, true));
                       Object.values(indicatorsObject).forEach((value) => {
                          Object.entries(value).forEach(([key, val]) => {
                            if (!total[key]) {
                              total[key] = {};
                            } 
                            Object.entries(val).forEach(([k, v]) => {
                              if (!total[key][k]) {
                                total[key][k] = v;
                              } else {
                                total[key][k] += v;
                              }
                            })
                          })
                        })
                        // console.log('TOTAL', total); 
                        indicatorsObject[keysAreGeos.total.label] = total;
                      }


                      const baseKeys = keysAreGeos.basePath.split('.');
                      source = createNestedObject(baseKeys, indicatorsObject);

                    } else {
                      // console.log(util.inspect(data, false, null, true));

                      if (!source?.[category]?.[section]) {
                        source[category][section] = {};
                      }

                      if ((!source?.[category]?.[section]?.[geo])) {
                        source[category][section][geo] = {};
                      }

                      // Object.entries(data).forEach(([indicatorKey, dataObject], i) =>
                      Object.entries(data?.[indicator] || {}).forEach(([key, value]) => {
                        const geoKey = config?.geoManifest?.[key] || key;
                        source[category][section][geo][geoKey] = {
                          [indicator]: value
                        }
                      })
                    }

                    if (keysAreGeos.flipNestedDepth) {
                        const obj = source;
                        
                      // function invertAtDepths(obj, depths = [6, 7]) {
                        const parentDepth = keysAreGeos.flipNestedDepth || 1;
                      
                        const walk = (node, depth) => {
                          if (depth === parentDepth && typeof node === 'object') {
                            const inverted = {};
                      
                            for (const parentKey in node) {
                              const children = node[parentKey];
                      
                              if (typeof children === 'object') {
                                for (const childKey in children) {
                                  if (!inverted[childKey]) inverted[childKey] = {};
                                  inverted[childKey][parentKey] = children[childKey];
                                }
                              } else {
                                // If it's not an object, just copy as-is
                                inverted[parentKey] = children;
                              }
                            }
                      
                            return inverted;
                          }
                      
                          // Recurse deeper if not yet at swap depth
                          if (typeof node === 'object' && node !== null) {
                            const result = Array.isArray(node) ? [] : {};
                            for (const key in node) {
                              result[key] = walk(node[key], depth + 1);
                            }
                            return result;
                          }
                      
                          return node; // Primitive value
                        }
                        
                        const invertedData = walk(obj, 1);
                        source = invertedData;
                      // }
                    }

                  } else if (geo) {
                    if (!source[category][geo]) {
                      source[category][geo] = {}
                    }
                    if (section) {
                      if (!source[category][geo][section]) {
                        source[category][geo][section] = {}
                      }
                      source[category][geo][section][indicator] = year
                        ? { [year]: data[indicator] }
                        : data[indicator]
                    } else {
                      if (!source[category][geo]) {
                        source[category][geo] = {}
                      }
                      source[category][geo][indicator] = year
                        ? { [year]: data[indicator] }
                        : data[indicator]
                    }
                  } else if (indicator) {
                    source[category] = {[indicator]: data[indicator] }
                  };
                  

                  // console.log('SOURCE', util.inspect(source, false, null, true));

                  updatedData = mergeObjects(
                    updatedData
                      ? updatedData
                      : structuredClone(dataFromDB.data),
                    source,
                    overwriteAt
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
          // Vodafone Raw Data and Aggregation
          case 'Vodafone-Raw': {
            const vodafoneCollection = db.collection('vodafone');
            const axios = require('axios');
            const fs = require('fs');
            const path = require('path');

            const url = 'https://coiapp2.cm-lisboa.pt/file/datahub/6ded279e-3c85-4ce2-9fab-0324256f41a7';
            const username = process.env.VODAFONE_USERNAME;
            const password = process.env.VODAFONE_PASSWORD;

            const timestamp = new Date().toISOString().replace(/:/g, '_').replace(/\./g, '_');
            const filename = 'voda_2025_06.csv' // `vodafone_data_${timestamp}.csv`; //'voda_2025_mar.csv'
            const filePath = path.resolve(__dirname, 'data', 'vodafone', filename);

            const downloadFile = async (url, username, password) => {
              const response = await axios({
                url,
                method: 'GET',
                responseType: 'stream',
                auth: {
                  username,
                  password
                }
              });

              const writer = fs.createWriteStream(filePath);

              response.data.pipe(writer);

              return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
              });
            };

            const createAggregatedData = async () => {

              const readline = require('readline');
              const stream = fs.createReadStream(filePath);
              const rl = readline.createInterface({
                input: stream,
                crlfDelay: Infinity
              });

              const aggregatedRawData = {};

              rl.on('line', (line) => {
                const [
                  grid,
                  dateTime, // '"2025-01-07 07:40"'
                  totalString,
                  roamingString
                ] = line.split(';');

                //skip header
                if (grid === 'grid_id') {
                  return;
                }

                const total = parseInt(totalString);
                const roaming = parseInt(roamingString);

                if (grid && dateTime && total >= 0 && roaming >= 0) {
                  const date = dateTime.split(' ')[0]?.replace(/"/g, '');
                  const time = dateTime.split(' ')[1]?.replace(/"/g, '');
  
                  const timeOfDay = () => {
                    if (time > '00:00' && time <= '06:00') {
                      return 'madrugada';
                    } else if (time > '06:00' && time <= '10:00') {
                      return 'manha';
                    } else if (time > '10:00' && time <= '17:00') {
                      return 'dia';
                    } else if (time > '17:00' && time <= '20:00') {
                      return 'tarde';
                    } else {
                      return 'noite';
                    }
                  }

                  if (!aggregatedRawData[grid]) {
                    aggregatedRawData[grid] = {};
                  }
                  if (!aggregatedRawData[grid][date]) {
                    aggregatedRawData[grid][date] = {};
                  }
                  if (!aggregatedRawData[grid][date][timeOfDay()]) {

                    aggregatedRawData[grid][date][timeOfDay()] = {
                      total: [total],
                      roaming: [roaming]
                    }
                  } else {
                    aggregatedRawData[grid][date][timeOfDay()].total.push(total);
                    aggregatedRawData[grid][date][timeOfDay()].roaming.push(roaming);
                  }
                }
              });

              return await new Promise((resolve) =>
                rl.on('close', () => {
                  const aggregatedData = [];
                  // console.log('AGGREGATED RAW DATA', util.inspect(aggregatedRawData, false, null, true));
                  Object.entries(aggregatedRawData).forEach(([grid, gridData]) => {
                    Object.entries(gridData).forEach(([date, dateData]) => {
                      const object = {
                        grid,
                        date,
                      };
                      Object.entries(dateData).forEach(([timeOfDay, timeData]) => {
                        const averageTotal = timeData.total.reduce((acc, curr) => acc + curr, 0) / timeData.total.length;
                        const averageRoaming = timeData.roaming.reduce((acc, curr) => acc + curr, 0) / timeData.roaming.length;
                        const maxTotal = Math.max(...timeData.total);
                        const maxRoaming = Math.max(...timeData.roaming);
                        const countTotal = timeData.total.length;
                        const countRoaming = timeData.roaming.length;
                        object[timeOfDay] = {
                          // grid,
                          // date,
                          // timeOfDay,
                          averageTotal,
                          averageRoaming,
                          maxTotal,
                          maxRoaming,
                          countTotal,
                          countRoaming
                        };
                      });
                      aggregatedData.push(object);
                    });
                  });
                  // console.log('AGGREGATED DATA SAMPLE', util.inspect(aggregatedData[0], false, null, true));
                  resolve(aggregatedData);
                }
                ));
            };

            try {
              // await downloadFile(url, username, password);
              // console.log('File downloaded successfully');
              
              // PROCESS FILE INTO DATABASE
              const getMaxInsertDate = async () => {
                const maxDate = await vodafoneCollection.find().sort({ date: -1 }).limit(1).toArray();
                return maxDate[0]?.date;
              };
              const maxInsertDate = await getMaxInsertDate();
              console.log('Max Insert Date:', maxInsertDate);
              const aggregatedData = await createAggregatedData()
                .then(data =>
                  data.filter(obj =>
                    maxInsertDate 
                    ? new Date(obj.date) > new Date(maxInsertDate)
                    : true
                  )
                );

              if (aggregatedData?.[0]) {
                const freguesias = require('./data/vodafone/freguesias.json');

                console.log('Aggregated data created successfully:', aggregatedData.length, 'records');
                const batchSize = 1000;
                for (let i = 0; i < aggregatedData.length; i += batchSize) {
                  const batch = aggregatedData.slice(i, i + batchSize).map(obj => ({
                    ...obj,
                    freguesia: freguesias[obj.grid],
                    date: new Date(obj.date),
                    updatedOn: new Date()
                  }));

                  await vodafoneCollection.insertMany(batch);
                  console.log(`Inserted batch ${i / batchSize + 1}`);
                }
              } else {
                console.log('No new data to insert');
              }
            } catch (error) {
              console.error('Error downloading the file:', error);
            }

            break;
          }
          case 'Vodafone-Aggregated': {
            const vodafoneCollection = db.collection('vodafone');
            const aggregationPipeline = [
              {
                '$addFields': {
                  'year': {
                    '$year': '$date'
                  },
                  'quarter': {
                    "$ceil": {
                      "$divide": [{ "$month": "$date" }, 3]
                    }
                  }
                }
              }, {
                '$group': {
                  '_id': {
                    'grid': '$grid',
                    'year': '$year',
                    'quarter': '$quarter'
                  },
                  'noite_avgTotal': {
                    '$avg': '$noite.averageTotal'
                  },
                  'noite_avgRoaming': {
                    '$avg': '$noite.averageRoaming'
                  },
                  'manha_avgTotal': {
                    '$avg': '$manha.averageTotal'
                  },
                  'manha_avgRoaming': {
                    '$avg': '$manha.averageRoaming'
                  },
                  'dia_avgTotal': {
                    '$avg': '$dia.averageTotal'
                  },
                  'dia_avgRoaming': {
                    '$avg': '$dia.averageRoaming'
                  },
                  'tarde_avgTotal': {
                    '$avg': '$tarde.averageTotal'
                  },
                  'tarde_avgRoaming': {
                    '$avg': '$tarde.averageRoaming'
                  },
                  'madrugada_avgTotal': {
                    '$avg': '$madrugada.averageTotal'
                  },
                  'madrugada_avgRoaming': {
                    '$avg': '$madrugada.averageRoaming'
                  }
                }
              },
              {
                '$sort': {
                  '_id.grid': 1
                }
              }
            ];

            const aggregatedData = await vodafoneCollection.aggregate(aggregationPipeline).toArray();
            // console.log('Aggregated Data:', util.inspect(aggregatedData, false, null, true));
            const formattedData = {};
            aggregatedData.forEach(obj => {
              const { grid, year, quarter } = obj._id;
              const quarterKey = `${year}-Q${quarter}`;
              if (!formattedData[grid]) {
                formattedData[grid] = {};
              }
              if (!formattedData[grid][quarterKey]) {
                formattedData[grid][quarterKey] = {};
              }
              formattedData[grid][quarterKey] = {
                noite: {
                  total: obj.noite_avgTotal,
                  roaming: obj.noite_avgRoaming
                },
                manha: {
                  total: obj.manha_avgTotal,
                  roaming: obj.manha_avgRoaming
                },
                dia: {
                  total: obj.dia_avgTotal,
                  roaming: obj.dia_avgRoaming
                },
                tarde: {
                  total: obj.tarde_avgTotal,
                  roaming: obj.tarde_avgRoaming
                },
                madrugada: {
                  total: obj.madrugada_avgTotal,
                  roaming: obj.madrugada_avgRoaming
                }
              }
            });
            // console.log('Formatted Data:', util.inspect(formattedData, false, null, true));
            if (config.mapToGeo) {
              const geoJSON = await geoCollection.findOne({
                project: config.project,
                geoType: config.geoType
              });

              const updatedGeoFeatures = geoJSON.features.map(feature => {
                const grid = `${feature.properties[config.joinField]}`;
                feature.properties = {
                  ...feature.properties,
                  average_mobile_devices: {
                    ...feature.properties.average_mobile_devices || {},
                    ...formattedData[grid] || {}
                  }
                }
                return feature;
              }
              );

              console.log('Updated Geo Features:', util.inspect(updatedGeoFeatures, false, null, true));

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
                ).then(() => console.log('Vodafone Grids Updated'))
                  .catch(err => console.log(err));
              }
            }
            // updatedData = mergeObjects(
            //   structuredClone(dataFromDB.data),
            //   formattedData
            // ); 
            break;
          }
          case 'INE API': {
            const data = await APISocket(config);
            console.log('INE DATA', config.description ,util.inspect(data, false, null, true));
            const formattedData = {};
            const { mapping } = config;
            const targetKeyArray = mapping?.targetKey?.split('.') || [];
            
            Object.entries(data).forEach(([key, rawValue]) => {
              const value = !mapping?.origin?.groupField
                ? Number(rawValue[0]?.valor)
                : {};
              if (mapping?.origin?.groupField) {
                rawValue.forEach((groupItem) => {
                  const group = groupItem[mapping.origin.groupField];
                  const valor = groupItem.valor;
                  if (!value[group] && valor) {
                    value[group] = Number(valor);
                  } else if (valor) {
                    value[group] += Number(valor);
                  }
                });
              }
              if (mapping.dateFormatter === 'month year to quarter') {
                const [monthString, yearString] = key.split(' ');
                const monthsByQuarter = {
                  'January': 'Q1',
                  'February': 'Q1',
                  'March': 'Q1',
                  'April': 'Q2',
                  'May': 'Q2',
                  'June': 'Q2',
                  'July': 'Q3',
                  'August': 'Q3',
                  'September': 'Q3',
                  'October': 'Q4',
                  'November': 'Q4',
                  'December': 'Q4',
                };
                const quarter = monthsByQuarter[monthString];
                const quarterKey = `${yearString}-${quarter}`;
                if (!formattedData[quarterKey]) {
                  formattedData[quarterKey] = value;
                } else {
                  formattedData[quarterKey] += value;
                }
              }
              if (mapping.dateFormatter === 'long to short quarter') {
                const keyArray = key.split(' ');
                const quarterString = keyArray[0].replace(/['st', 'nd', 'rd', 'th']/g, '');
                const yearString = keyArray[2];

                const quarterKey = `${yearString}-Q${quarterString}`;
                if (!formattedData?.[quarterKey]) {
                  formattedData[quarterKey] = value;
                } else {
                  formattedData[quarterKey] += value;
                }
              }
              if (mapping.dateFormatter === 'school year to year') {
                const keyArray = key.split('/');
                const yearString = keyArray[1].trim();
                const yearKey = yearString;
                if (!formattedData[yearKey]) {
                  formattedData[yearKey] = value;
                } else {
                  formattedData[yearKey] += value;
                }
              }
            });

            if (mapping?.origin?.groupField) {
              Object.entries({...formattedData}).forEach(([key, value]) => {
                Object.entries(value).forEach(([groupKey, groupValue]) => {
                  if (!formattedData[groupKey]) {
                    formattedData[groupKey] = {};
                  }
                  if (!formattedData[groupKey][key]) {
                    formattedData[groupKey][key] = groupValue;
                  }
                  else {
                    formattedData[groupKey][key] += groupValue;
                  }
                });
                delete formattedData[key];
              });
            }
            // console.log('Formatted Data:', util.inspect(formattedData, false, null, true));

            const mappedData = targetKeyArray[0]
              ? createNestedObject(targetKeyArray, formattedData)
              : {
                [mapping.section]: {
                  [mapping.geo]: {
                    [mapping.indicator]: formattedData
                  }
                }
              }
            console.log('MAPPED DATA', util.inspect(mappedData, false, null, true));
            updatedData = mergeObjects(
              structuredClone(dataFromDB.data),
              mappedData
            )
            break;
          }
          case 'ESRI API': {
            const data = await APISocket(config);
            // console.log('Turismo de Portugal DATA', config.description, util.inspect(data, false, null, true));
            const formattedData = {};
            const { mapping } = config;
            const targetKeyArray = mapping?.targetKey?.split('.') || [];
            console.log(config.description, ':', mapping);
            if (mapping.aggregator === 'count by quarter') {
              data.features.forEach(feature => {
                const { attributes } = feature;
                const dateValue = attributes[mapping.origin.dateField];
                if (mapping.origin.dateFormatter === 'unix timestamp to quarter') {
                  const date = new Date(dateValue);
                  const quarter = Math.floor((date.getMonth() + 3) / 3);
                  const year = date.getFullYear();
                  const quarterKey = `${year}-Q${quarter}`;
                  if (!formattedData[quarterKey]) {
                    formattedData[quarterKey] = 1;
                  }
                  else {
                    formattedData[quarterKey] += 1;
                  }
                }
              }
              )
            }

            if (mapping.aggregator === 'sum by quarter') {
              console.log('SUM BY QUARTER', util.inspect(data, false, null, true));
              data.features.forEach(feature => {
                const { attributes } = feature;
                const dateValue = attributes[mapping.origin.dateField];
                const value = attributes[mapping.origin.valueField];
                if (mapping.origin.dateFormatter === 'unix timestamp to quarter') {
                  const date = new Date(dateValue);
                  const quarter = Math.floor((date.getMonth() + 3) / 3);
                  const year = date.getFullYear();
                  const quarterKey = `${year}-Q${quarter}`;
                  if (!formattedData[quarterKey]) {
                    formattedData[quarterKey] = value;
                  }
                  else {
                    formattedData[quarterKey] += value;
                  }
                }
              }
              )
            }

            const mappedData = targetKeyArray[0]
              ? createNestedObject(targetKeyArray, formattedData)
              : {
                [mapping.section]: {
                  [mapping.geo]: {
                    [mapping.indicator]: formattedData
                  }
                }
              }

            console.log('MAPPED DATA', util.inspect(mappedData, false, null, true));
            updatedData = mergeObjects(
              structuredClone(dataFromDB.data),
              mappedData
            )

            break;
          }
          case 'AWS S3 SYNC': {
            // const { source, destination } = config;
            await AWS_S3_Sync(config);
            // UNZIP CSV.GZIP FILES IN EACH FOLDER

            // const { exec } = require('child_process');
            // const path = require("path");
            // const command = `gunzip -r ${source}`;
            // console.log(`Executing command: ${command}`);
            // exec(command, (error, stdout, stderr) => {
            //   if (error) {
            //     console.error(`Error executing command: ${error.message}`);
            //     return;
            //   }
            //   if (stderr) {
            //     console.error(`stderr: ${stderr}`);
            //     return;
            //   }
            //   console.log(`stdout: ${stdout}`);
            // });
            // const fs = require('fs');
            // const path = require('path');
            // const directoryPath = path.join(__dirname, source);
            // fs.readdir(directoryPath, (err, files) => {
            //   if (err) {
            //     return console.log('Unable to scan directory: ' + err);  
            //   }
            //   files.forEach(file => {
            //     const filePath = path.join(directoryPath, file);
            //     fs.stat(filePath, (err, stats) => {
            //       if (err) {
            //         console.error('Error getting file stats:', err);
            //         return;
            //       } 
            //       if (stats.isFile() && file.endsWith('.csv.gz')) {
            //         const unzipCommand = `gunzip ${filePath}`; 
            //         exec(unzipCommand, (error, stdout, stderr) => {  
            //           if (error) {
            //             console.error(`Error unzipping file: ${error.message}`);
            //             return;
            //           }
            //           if (stderr) {
            //             console.error(`stderr: ${stderr}`);  
            //             return;
            //           }
            //           console.log(`stdout: ${stdout}`);
            //         });
            //       }
            //     });
            //   });
            // });             

            // CREATE UNIONS OF ALL THE CSVS IN EACH FOLDER

            // const fs = require('fs');
            // const path = require('path');
            // const directoryPath = path.join(__dirname, source);
            // fs.readdir(directoryPath, (err, files) => {
            //   if (err) {
            //     return console.log('Unable to scan directory: ' + err);
            //   }
            //   files.forEach(file => {
            //     const filePath = path.join(directoryPath, file);
            //     fs.stat(filePath, (err, stats) => {
            //       if (err) {
            //         console.error('Error getting file stats:', err);
            //         return;
            //       }
            //       if (stats.isFile() && file.endsWith('.csv')) {
            //         const unionCommand = `cat ${filePath} >> ${destination}/${file}`;
            //         exec(unionCommand, (error, stdout, stderr) => {
            //           if (error) {
            //             console.error(`Error uniting files: ${error.message}`);
            //             return;
            //           }
            //           if (stderr) {
            //             console.error(`stderr: ${stderr}`);
            //             return;
            //           }
            //           console.log(`stdout: ${stdout}`);
            //         });
            //       }
            //     });
            //   });
            // });

            // UPLOAD NEW CSVS TO ONEDRIVE DIRECTORY

            


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
            { $set: updateObject },
            { upsert: true }
          )
          if (config._id) {
            await socketCollection.findOneAndUpdate(
              { _id: config._id },
              { $set: { processedDate: new Date() } }
            )
          }

          // HANDLE SOCKET CONFIG UPDATE
        } else if (updatedData) {
          // HANDLE NO NEW DATA
          if (config?.mapToGeo || config?.rawDataUpdate) {
            await socketCollection.findOneAndUpdate(
              { _id: config._id },
              { $set: { processedDate: new Date() } }
            )
            console.log(config._id || "*", 'UPDATED GEO OR RAW DATA')
          } else {
            console.log(config._id || "*", 'NO NEW DATA')
          }
        } else {
          console.log(config._id || "*", 'NO UPDATE')
          // console.log( || "*", config?.mapToGeo ? 'MAPPPED TO GEO' : 'NO DATA')
          // // HANDLE NO DATA
          // if (config?.mapToGeo) {
          //   await socketCollection.findOneAndUpdate(
          //     { _id: config._id },
          //     { $set: { processedDate: new Date() } }
          //   )
          // }
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