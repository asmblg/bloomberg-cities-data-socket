const axios = require('axios');

const getCensusData = async (url, query) => {
  const queryKeys = Object.keys(query);
  let queryString = '';

  if (queryKeys[0]) {
    queryKeys.forEach(
      (key, i) => (queryString += i === 0 ? `${key}=${query[key]}` : `&${key}=${query[key]}`)
    );
  }

  const apiURL = queryString ? `${url}?${queryString}` : url;
  console.log({ apiURL });

  const { data } = await axios.get(apiURL);
  return data;
};

const mapInNewData = ({ censusData, cityData, mappings }) => {
  const dbObj = { ...cityData };
  // Remove header array from returned census data
  const dataArr = censusData.slice(1);

  dataArr.forEach(arr => {
    mappings.forEach(
      ({ destination: { geo, category, indicator }, origin: { valueIndex, keyIndexes } }) => {
        const key = keyIndexes ? keyIndexes.map(i => arr[i]).join('') : null;

        dbObj.data[geo][category][indicator] = !key
          ? arr[valueIndex]
          : {
              ...dbObj.data[geo][category][indicator],
              [key]: arr[valueIndex]
            };
      }
    );
  });
  return dbObj;
};

module.exports = { getCensusData, mapInNewData };
