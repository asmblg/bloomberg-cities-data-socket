const mongoJS = require('mongojs');
require('dotenv').config();

const config = require('./seeds/dataSocketConfigSeed.json');

const init = () => {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    const db = mongoJS(uri);
    const dsConfigCol = db.collection('dataSocketConfig');

    dsConfigCol.insertMany(config, err => {
      if (err) {
        console.log(err);
        process.exit(1);
      } else {
        console.log('process complete. exiting...');
        process.exit(0);
      }
    });
  }
};

init();
