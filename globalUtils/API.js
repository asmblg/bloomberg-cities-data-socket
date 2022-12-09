const citiesData = require('../data.json');
const config = require('../config.json');

// Emulates Get Config from DB
const getConfig = async () => {
  return config;
};

// Emulates Get Project Data by ID
const getDbData = async id => {
  const cityData = citiesData.find(({ project }) => project === id);
  return cityData;
};

module.exports = { getConfig, getDbData };
