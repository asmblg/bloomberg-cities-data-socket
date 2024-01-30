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

const getDataSocketConfig = (collection, query) => {
  // new Promise((resolve, reject) => {
  //   console.log(query);
  //   // const collection = db.collection('dataSocketConfig');
  //   collection.find(query, (err, docs) => {
  //     if (err) {
  //       reject(err);
  //     } else {
  //       resolve(docs);
  //     }
  //   });
  console.log(query);
  // Ensure the collection is properly referenced
  if (!collection) {
    return Promise.reject(new Error("Collection not provided"));
  }

  // Use MongoDB's built-in promise support
  return collection.find(query).toArray()
    .then(docs => {
      return docs; // Return the documents
    })
    .catch(err => {
      console.error("Error retrieving data:", err);
      throw err; // Rethrow or handle error as needed
    });
  };

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
    collection.find({ project: project.toLowerCase() }, (err, docs) => {
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
