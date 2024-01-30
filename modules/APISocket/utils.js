const axios = require('axios');

const getCensusData = async ({url, query}) => {
  const queryKeys = Object.keys(query);
  let queryString = '';

  if (queryKeys[0]) {
    queryKeys.forEach(
      (key, i) => (queryString += i === 0 ? `${key}=${query[key]}` : `&${key}=${query[key]}`)
    );
  }

  const apiURL = queryString ? `${url}?${queryString}` : url;
  const { data } = await axios.get(apiURL);

  return data;
};

const getBLSData = async ({url, tables}) => {

  const result = []
  // const queryKeys = Object.keys(query);
  const apiKey = process.env.BLS_API_KEY;
  const bufferedArrays = [];
  const bufferSize = 50;
  var buffer = [];

  tables.forEach(({seriesID}, i) => {
    if (buffer.length < bufferSize && i !== tables.length - 1) {
      buffer.push(seriesID)
    } else {
      // buffer.push(seriesID)
      bufferedArrays.push(buffer);
      buffer = [seriesID];
    }
  });

  for await (seriesIDs of bufferedArrays) {
    
    const payload = {
      seriesid: [...seriesIDs],
      registrationkey: apiKey
    }
  
    const {data} = await axios({
      method: 'post',
      url: url,
      header: 'Content-Type= application/json',
      data: payload
    });
  
    if (data?.Results) {
      const {series} = data.Results;
      series.forEach(obj => {
        const dataObj = {};
        const mapping = tables.find(({seriesID}) => seriesID === obj.seriesID)?.mapping
        obj.data.forEach(({year, period, value}) =>{
          const dateKey = `${year}-${period.replace(/m/i, '')}-1`
          dataObj[dateKey] = value; 
        });
        result.push({
          data: dataObj,
          mapping: mapping
        });
      })
    }
  };




  // for await (obj of tables){
  //   let error = null;
  //   // console.log(seriesID);
  //   const response = await axios({
  //     method: 'post',
  //     url: apiURL,
  //     header: 'Content-Type= application/json',
  //     data: 
  //   }).catch(err => error = err);

  //   const data = response?.data;

  //   if (data && !error) {
  //     // console.log(data);

  //     console.log(`${obj.seriesID} retrieved.`)

  //     const serieData = data.Results?.series?.[0] 
  //       ? data.Results.series[0].data
  //       : [];
  
  //     const dataObj = {};
  
  //     serieData.forEach(({year, period, value}) =>{
  //       if (!dataObj[year]) {
  //         dataObj[year] = {}
  //       };
  //       dataObj[`${year}-${period.replace(/m/i, '')}-1`] = value 
  //     });
  //     // console.log(catalog);
  //     result.push({
  //       data: dataObj,
  //       mapping: obj.mapping
  //     });
  //   } else {
  //     console.log(`${obj.seriesID} NOT retrieved.`)
  //   }

  //   if (error) {
  //     console.log(error);
  //   }

  //   // result[area] = data.Results.series[0].data[0].value
  // };
  return result;
};



module.exports = { getCensusData, getBLSData };
