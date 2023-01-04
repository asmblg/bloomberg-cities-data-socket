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
  const { data } = await axios.get(apiURL);

  return data;
};

const mapInNewData = ({ censusData, data, mappings }) => {
  const obj = { ...data };
  const keysArr = censusData[0];
  // Remove header array from returned census data
  const dataArr = censusData.slice(1);

  dataArr.forEach(arr => {
    mappings.forEach(
      ({ destination: { geo, category, indicator, year }, origin: { valueIndex, keyIndexes } }) => {
        const key = keyIndexes ? keyIndexes.map(key => arr[keysArr.indexOf(key)]).join('') : null;

        if (!obj[geo][category][indicator]) {
          obj[geo][category][indicator] = {};
        }

        obj[geo][category][indicator][year] = !key
          ? arr[keysArr.indexOf(valueIndex)]
          : {
              ...obj[geo][category][indicator][year],
              [key]: arr[keysArr.indexOf(valueIndex)]
            };
      }
    );
  });
  return obj;
};

module.exports = { getCensusData, mapInNewData };
