const mongoJS = require('mongojs');

const getDbConnection = uri =>
  new Promise((resolve, reject) => {
    const db = mongoJS(uri);

    if (db) {
      resolve(db);
    } else {
      reject('Error connecting to DB');
    }
  });

const getDataSocketConfig = db =>
  new Promise((resolve, reject) => {
    const collection = db.collection('dataSocketConfig');
    collection.find((err, docs) => {
      if (err) {
        reject(err);
      } else {
        resolve(docs);
      }
    });
  });

const createDataDoc = (db, project) =>
  new Promise((resolve, reject) => {
    const newDataObj = {
      project: project,
      data: {
        city: {
          economic: {},
          newBusinesses: {},
          demographic: {}
        },
        tract: {
          economic: {},
          newBusinesses: {},
          demographic: {}
        }
      }
    };

    const collection = db.collection('data');
    collection.insert(newDataObj, (err, docs) => {
      if (err) {
        reject(err);
      } else {
        resolve(docs);
      }
    });
  });

// Returns found Data Object or newly created Data Object
const getProjectData = (db, project) =>
  new Promise((resolve, reject) => {
    const collection = db.collection('data');
    collection.find({ project }, (err, docs) => {
      if (err) {
        reject(err);
      } else if (docs.length === 1) {
        resolve(docs[0]);
      } else {
        createDataDoc(db, project).then(res => {
          resolve(res);
        });
      }
    });
  });

const updateProjectData = (db, id, data) =>
  new Promise((resolve, reject) => {
    const collection = db.collection('data');
    collection.update({ _id: id }, { $set: { data } }, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

module.exports = { getDataSocketConfig, getProjectData, updateProjectData, getDbConnection };
