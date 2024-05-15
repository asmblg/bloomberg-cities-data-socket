const { MongoClient } = require('mongodb');
const { createReadStream } = require('fs');
const { createGunzip, PassThrough } = require('zlib');
const axios = require('axios');
const axiosRetry = require('axios-retry')
const https = require('https');
const fs = require('fs');
const { unlink, readdir } = require('fs/promises')
const csv = require('csv-parser');

const ToMongoDB = async ({
  filePath,
  sourceDirectory,
  // dbName, 
  // collectionName, 
  filters,
  updateQueryFields,
  // url,
  collection
}) => {
  // console.log(url)
  // console.log('Connected to', collectionName);

  const stream = filePath.includes('.gz')
    ? createReadStream(filePath)
      .pipe(createGunzip()) // decompress gzip file
      .pipe(csv())
    : createReadStream(filePath)
      .pipe(csv())

  let total = 0;
  let inserted = 0;

  const dateFields = [
    'spend_date_range_start',
    'spend_date_range_end',
    'opened_on',
    'closed_on'
  ];

  const idFields = [
    'placekey',
    'safegraph_brand_ids',
    'parent_placekey',
    'naics_code',
    'phone_number',
    'street_address',
    'postal_code'
  ];

  const arrayFieds = [
    'spend_by_day',
    'spend_per_transaction_by_day',
    'websites'
  ];

  const objFields = [
    "spend_per_transaction_percentiles",
    "spend_by_day_of_week",
    "day_counts",
    "transaction_intermediary",
    "spend_by_transaction_intermediary",
    "bucketed_customer_frequency",
    "mean_spend_per_customer_by_frequency",
    "bucketed_customer_incomes",
    "mean_spend_per_customer_by_income",
    "customer_home_city",
    "related_cross_shopping_physical_brands_pct",
    "related_cross_shopping_online_merchants_pct",
    "related_cross_shopping_same_category_brands_pct",
    "related_cross_shopping_local_brands_pct",
    "related_wireless_carrier_pct",
    "related_streaming_cable_pct",
    "related_delivery_service_pct",
    "related_rideshare_service_pct",
    "related_buynowpaylater_service_pct",
    "related_payment_platform_pct",
    "open_hours"
  ];

  const include = async (data, filters) => await new Promise(resolve => {
    if (filters) {
      filters.forEach(filterObj => {

        const booleans = [];

        Object.entries(filterObj).forEach(([key, value]) => {
          if (data[key] === value) {
            booleans.push(true)
          } else {
            booleans.push(false)
          }
        });

        if (!booleans.includes(false)) {
          resolve(true);
        };
      });
      resolve(false);
    } else {
      resolve(true)
    }
  });
  await new Promise(resolve => {
    stream.on('data', async (data) => {

      const obj = {};

      Object.entries(data).forEach(([rawKey, value]) => {
        const key = rawKey.toLowerCase();
        if (idFields.includes(key)) {
          obj[key] = value;
        } else if (arrayFieds.includes(key) || objFields.includes(key)) {
          obj[key] = value ? JSON.parse(value) : null;
        } else if (dateFields.includes(key)) {
          obj[key] = new Date(value || '9999-12-31');
        } else if (!isNaN(parseInt(value))) {
          obj[key] = parseFloat(value);
        } else {
          obj[key] = value;
        }
      })

      if (await include(obj, filters)) {
        if (obj.latitude && obj.longitude) {
          obj.geometry = {
            type: 'Point',
            coordinates: [obj.longitude, obj.latitude]
          }
        };

        // console.log(obj);

        if (updateQueryFields) {
          const updateQuery = {};

          updateQueryFields.forEach(key =>
            updateQuery[key] = obj[key]
          );
          await collection.findOneAndUpdate(
            updateQuery,
            { $set: { ...obj, source_directory: sourceDirectory } },
            { upsert: true }
          )
        } else {
          await collection.insertOne(obj);
        }


        inserted++
      };
      total++;

      if (total % 10000 === 0) {
        console.log(`Of ${total}...${inserted} inserted`);
      }
      // }

    });
    stream.on('end', async () => {
      console.log(`${total} total documents processed...${inserted} inserted.`);
      await unlink(filePath);
      setTimeout(() => resolve(console.log('Deleted...', filePath)), 1000);
    });
    stream.on('error', (err) => {
      throw err;
    });
  });


  //   try {
  //   for await (const data of stream) {
  //     const obj = {};

  //     Object.entries(data).forEach(([rawKey, value]) => {
  //       const key = rawKey.toLowerCase();
  //       if (idFields.includes(key)) {
  //         obj[key] = value;
  //       } else if (arrayFieds.includes(key) || objFields.includes(key)) {
  //         obj[key] = value ? JSON.parse(value) : null;
  //       } else if (dateFields.includes(key)) {
  //         obj[key] = new Date(value || '9999-12-31');
  //       } else if (!isNaN(parseInt(value))) {
  //         obj[key] = parseFloat(value);
  //       } else {
  //         obj[key] = value;
  //       }
  //     })

  //     if (await include(obj,filters)) {  
  //       if (obj.latitude && obj.longitude) {
  //         obj.geometry = {
  //           type: 'Point',
  //           coordinates: [obj.longitude, obj.latitude]
  //         }
  //       };

  //       // console.log(obj);

  //       if (updateQueryFields) {
  //         const updateQuery = {};

  //         updateQueryFields.forEach(key =>
  //           updateQuery[key] = obj[key]  
  //         );
  //         await collection.findOneAndUpdate(
  //           updateQuery, 
  //           {$set: {...obj, source_directory: sourceDirectory}}, 
  //           {upsert: true}
  //         )          
  //       } else {
  //         await collection.insertOne(obj);
  //       }


  //       inserted++
  //     };
  //     total++;

  //     if (total % 10000 === 0) {
  //       console.log(`Of ${total}...${inserted} inserted`);
  //     } 

  //   }
  // } catch (err) {
  //   throw err
  // } finally {
  //   console.log(`${total} total documents processed...${inserted} inserted.`);
  //   await unlink(filePath);
  //   console.log('Deleted...', filePath)
  // }

  // await new Promise(resolve => {





  //   stream.on('data', async (data) => {

  //       const obj = {};

  //       Object.entries(data).forEach(([rawKey, value]) => {
  //         const key = rawKey.toLowerCase();
  //         if (idFields.includes(key)) {
  //           obj[key] = value;
  //         } else if (arrayFieds.includes(key) || objFields.includes(key)) {
  //           obj[key] = value ? JSON.parse(value) : null;
  //         } else if (dateFields.includes(key)) {
  //           obj[key] = new Date(value || '9999-12-31');
  //         } else if (!isNaN(parseInt(value))) {
  //           obj[key] = parseFloat(value);
  //         } else {
  //           obj[key] = value;
  //         }
  //       })

  //       if (await include(obj,filters)) {  
  //         if (obj.latitude && obj.longitude) {
  //           obj.geometry = {
  //             type: 'Point',
  //             coordinates: [obj.longitude, obj.latitude]
  //           }
  //         };

  //         // console.log(obj);

  //         if (updateQueryFields) {
  //           const updateQuery = {};

  //           updateQueryFields.forEach(key =>
  //             updateQuery[key] = obj[key]  
  //           );
  //           await collection.findOneAndUpdate(
  //             updateQuery, 
  //             {$set: {...obj, source_directory: sourceDirectory}}, 
  //             {upsert: true}
  //           )          
  //         } else {
  //           await collection.insertOne(obj);
  //         }


  //         inserted++
  //       };
  //       total++;

  //       if (total % 10000 === 0) {
  //         console.log(`Of ${total}...${inserted} inserted`);
  //       }    
  //     // }

  //   });
  //   stream.on('end', async () => {
  //     console.log(`${total} total documents processed...${inserted} inserted.`);
  //     await unlink(filePath);
  //     resolve(console.log('Deleted...', filePath));
  //   });
  //   stream.on('error', (err) => {
  //     throw err;
  //   });
  // });

};

// const getPlaceKeys = query => {

//   const apiKey = 'K6PuCa4KJ2KylxXpB0HO757VcjBwgjUs';

//   axios.get('https://api.placekey.io/v1/placekey', {
//     headers: {
//       apikey: apiKey
//     },
//     params: {
//       ...query
//     }
//   })
//     .then(response => {
//       const placekeys = response.data;
//       console.log(placekeys);
//     })
//     .catch(error => {
//       console.log(error);
//     });

// };

// const getToken = async () => {
//   const authKey = 'ZXJpay53b29kd29ydGhAYXNtYmxnLmlvOnFhYlp1OXRSR0RuUHAzZQ=='
//   const config = {
//     method: 'post',
//     url: 'https://marketplace.deweydata.io/api/auth/tks/get_token',
//     headers: {
//       'Authorization': `Basic ${authKey}`,
//       'Accept': 'application/json',
//       'Content-Type': 'application/json'
//     }
//   };
//   const result = await axios(config)
//   // .then( (response) => response)
//   // .catch( (error) => console.log(error));

//   return result.data
// };

const deleteRecords = async ({ query, dbName, collectionName }) => {
  const url = 'mongodb://127.0.0.1:27017';
  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  const result = await collection.deleteMany(query);

  console.log(result);
  await client.close();
}

const getFileLinks = async ({
  apiURL, params, fileType
}) => {

  if (params?.partition_key_after && !params?.partition_key_before) {
    const date = new Date(params.partition_key_after);
    // Add 3 months to the date

    date.setMonth(date.getMonth() + 3);
    params.partition_key_before = date.toISOString().split('T')[0]
  }

  const API_KEY = process.env.SAFEGRAPH_API_KEY
  var config = {
    method: 'get',
    params: {
      ...params,
      file_extension: fileType
    },
    // url: `https://marketplace.deweydata.io/api/data/v2/list/${path}/?erik.woodworth@asmblg.io`,
    url: apiURL,
    headers: {
      "X-API-KEY": API_KEY,
      'accept': 'application/json'
      // 'Authorization': `Bearer ${access_token}`
    }
  };


  const { data } = await axios(config)
    // .then(({ data: download_links }) => download_links)
    .catch((error) => console.log(error));

  // console.log(fileLinks);
  const fileLinks = data?.download_links.map(({ link }) => link)

  return fileLinks
  // ? fileLinks
  //   .filter(({name}) => name.includes('.csv.gz'))
  //   .map(({ url }) => url) 
  // : []
};

const downloadFiles = async ({ linkArray, tempDir, fileType }) => {
  // const { access_token } = await getToken()
  // const baseURL = 'https://marketplace.deweydata.io'
  let count = 0;
  // axiosRetry(
  //   axios, 
  //   {
  //     retries: 3, 
  //     retryDelay: axiosRetry.exponentialDelay,
  //     retryCondition: (err) => {
  //       console.log('Retry attempted', err);
  //       return axiosRetry.isRetryableError(err)
  //     }
  //   })
  // // Custom https agent configuration
  // const httpsAgent = new https.Agent({
  //   rejectUnauthorized: true, // You can adjust this for self-signed certificates
  //   // Additional SSL/TLS configuration if needed
  // });

  let retryCount = 0
  for await (link of linkArray) {
    retryCount = 0

    const config = {
      method: 'get',
      url: link,
      responseType: 'stream',
      timeout: 10000,
      // httpsAgent: httpsAgent
      // url: `${baseURL}${link}`,
      // responseType: 'stream',
      // headers: {
      //   'Authorization': `Bearer ${access_token}`
      // }
    };
    const file = fs.createWriteStream(`${tempDir}file-${count}${fileType}`);

    console.log('Download:', `${link}`);

    const download = async () => {
      try {
        const response = await axios(config);
        console.log('Download beginning...');
        response.data.pipe(file);

        return new Promise((resolve, reject) => {
          file.on("finish", () => {
            console.log('Download complete.');
            resolve();
          });
          file.on("error", (err) => {
            reject(err);
          });
        });
      } catch (err) {
        if (retryCount < 2) {
          console.log('Retry download');
          retryCount++;
          return download();
        } else {
          throw { retries: retryCount, error: err };
        }
      }
    }

    await download();

    // const download = async () => await new Promise((resolve, reject) => axios(config)
    //   .then(response => {
    //     // console.log(response);
    //     console.log('Download beginning...')
    //     response.data.pipe(file);
    //     // after download completed close filestream
    //     file.on("finish", () => {
    //       console.log('Download complete.')
    //       resolve(file.close());
    //     });
    //   })
    //   .catch(async err => {
    //     if (err && retryCount < 2) {
    //       console.log('Retry download')
    //       reject(await download());
    //       retryCount++
    //     } else {
    //       reject({retries: retryCount, error: err});
    //     }
    //   })
    // );

    // await download();

    count++;
  };
  return `${count} Files Downloaded`

};

const safegraphDataToDB = async (config) => {
  const {
    dbURI,
    dbName,
    tempDir,
    fileType,
    apiURL,
    params,
    collectionName
  } = config;

  const client = new MongoClient(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const fileLinks = await getFileLinks({ apiURL, params, fileType });
    console.log('Beginning download of:', fileLinks);

    const downloadResult = await downloadFiles({
      linkArray: fileLinks,
      tempDir: tempDir,
      fileType
    });
    console.log(downloadResult);

    const listOfFiles = await readdir(tempDir);
    console.log(listOfFiles);

    for await (const fileName of listOfFiles) {
      if (fileName.includes(fileType)) {
        console.log('Processing to DB: ', fileName);
        await ToMongoDB({
          filePath: `${tempDir}${fileName}`,
          collection,
          ...config
        });
      }
    }
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    console.log('Done processing files.');
    await client.close();
  }
};


const updateDataDashboard = async config => {
  const {
    dashboardDataUpdate : {
      aggregationPipeline,
      dbName,
      collectionName,
      stateKey,
      topCities
    },
    rawDataURI
  } = config;

  // console.log(config);

  const url = rawDataURI;


  const client = await MongoClient.connect(
    url,
    { useNewUrlParser: true, useUnifiedTopology: true }
  );
  console.log('Connected to MongoDB', url)
  const coll = client.db(dbName).collection(collectionName);
  console.log(aggregationPipeline)
  const cursor = coll.aggregate(aggregationPipeline);
  const array = await cursor.toArray();
  

  await client.close();

  const result = {};

  array.forEach(({
    _id: {
      month,
      year,
      naics,
      naics4
    },
    total_spending,
    total_customers,
    customers_by_city,
    total_transactions

  }) => {
    let value = null;

    if (total_customers && customers_by_city && !topCities) {
      let totalTourists = 0;
      customers_by_city.forEach(obj => {
        Object.entries(obj).forEach(([key, v]) => {
          const state = key.split(',')[1];
          if (state.trim() !== stateKey) {
            totalTourists += v
          }
        })
      });
      if (totalTourists > 0) {
        value = (totalTourists / total_customers) * 100
      }
    } else if (total_spending || total_transactions) {
      value = total_spending || total_transactions;
    } else if (topCities) {
      if (!result['top_cities']) {
        result['top_cities'] = {}
      }
      customers_by_city.forEach(obj => {
        Object.entries(obj).forEach(([key, v]) => {
          const state = key.split(',')[1];
          if (state.trim() !== stateKey) {
            if (!result['top_cities'][key]) {
              result['top_cities'][key] = v
            } else {
              result['top_cities'][key] += v
            }
          }
        })
      });
    }

    if (value) {
      if (!result[naics4 || naics]) { result[naics4 || naics] = {} }
      result[naics4 || naics][`${year}-${month}-1`] = value
    }
  });

  if (topCities && result['top_cities']) {
    const cities = Object.entries(result['top_cities'])
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => ({ [k]: v }))
      .slice(0, 10);

    result['top_cities'] = cities


  }


  return result;

};

module.exports = {
  ToMongoDB,
  getFileLinks,
  getFileLinks,
  downloadFiles,
  deleteRecords,
  safegraphDataToDB,
  updateDataDashboard
}