const updateWithDataArrays = ({
  arrayData,
  dataFromDB,
  mappings
}) => {
  const obj = { ...dataFromDB.data };
  const keysArr = arrayData[0];
  // Remove header array from returned census data
  const dataArr = arrayData.slice(1);

  dataArr.forEach(arr => {
    mappings.forEach(
      ({ destination: { geo, category, indicator, year }, origin: { valueIndex, keyIndexes } }) => {
        const key = keyIndexes ? keyIndexes.map(key => arr[keysArr.indexOf(key)]).join('') : null;

        if (!obj[category]){
          obj[category] = {}
        }

        if (!obj[category][geo]){
          obj[category][geo] = {}
        }

        if (!obj[category][geo][indicator]) {
          obj[category][geo][indicator] = {};
        }

        obj[category][geo][indicator][year] = !key
          ? arr[keysArr.indexOf(valueIndex)]
          : {
            ...obj[category][geo][indicator][year],
            [key]: arr[keysArr.indexOf(valueIndex)]
          };
      }
    );
  });
  return obj;
};

const updateGeoJSONWithDataArrays = ({
  arrayData,
  geoJSON,
  joinField,
  mappings
}) => {
  const keysArr = arrayData[0];
  const dataArr = arrayData.slice(1);
  const obj = {};

  // console.log(geoJSON);

  dataArr.forEach(arr => {
    mappings.forEach(({ 
      destination: { 
        // geo,
        // category,
        indicator,
        year, 
      },
      origin: { 
        valueIndex, 
        keyIndexes } 
      }) => {

    const key = keyIndexes 
      ? keyIndexes.map(key => arr[keysArr.indexOf(key)]).join('') 
      : null;

    if (!obj[key]) {
      obj[key] = {};
    }

    obj[key][indicator] =  arr[keysArr.indexOf(valueIndex)]
      // ? arr[keysArr.indexOf(valueIndex)]
      // : {
      //     ...obj[indicator][year],
      //     [key]: arr[keysArr.indexOf(valueIndex)]
      //   };
    })
  });

  const features = geoJSON.features.map(feature => (
    {
      ...feature,
      properties: {
        ...feature.properties,
        ...obj[feature.properties[joinField]]
      }
    }
  ))

  return features

};

const updatedWithObject = ({
  dataFromDB,
  obj: {
    data,
    mapping: {
      section,
      geotype,
      geo,
      category,
      indicator
    }
  }
}) => {
  // console.log(geo);
  if (!dataFromDB['data'][section]) {
    dataFromDB['data'][section] = {}
  }

  if (!dataFromDB['data'][section][geotype]) {
    dataFromDB['data'][section][geotype] = {}
  }
  if (!dataFromDB['data'][section][geotype][geo || category]) {
    dataFromDB['data'][section][geotype][geo || category] = {}
  }
  if (geo && category){
    if (!dataFromDB['data'][section][geotype][geo][category]) {
      dataFromDB['data'][section][geotype][geo][category] = {};
    }
    // MERGE DATA WITH EXISTING OBJECT HERE 
    dataFromDB['data'][section][geotype][geo][category][indicator] = data;
  } else {
    // AND HERE
    dataFromDB['data'][section][geotype][geo || category][indicator] = data;
  }

  return dataFromDB;
};

const updateByObjectKeyYearQuarter = ({
  dataFromDB,
  mapping: {
    year,
    quarter,
    geotype,
    section
  },
  obj
}) => {
  Object.entries(obj).forEach(([key, value]) => {
    
    if (!dataFromDB[section]) {
      dataFromDB[section] = {}
    }
    
    if (!dataFromDB[section][geotype]) {
      dataFromDB[section][geotype] = {}
    }
    
    if (!dataFromDB[section][geotype][key]) {
      dataFromDB[section][geotype][key] = {}
    }
    dataFromDB[section][geotype][key][`${year}-${quarter}`] = value
  })
  return dataFromDB;

};

const updateByObjectKeysYearQuarter = ({
  dataFromDB,
  mapping: {
    year,
    quarter,
    geotype,
    section,
    subtype
  },
  obj
}) => {
  // console.log(obj);
  // console.log(dataFromDB[section][geotype]);

  if (!dataFromDB[section]) {
    dataFromDB[section] = {}
  }

  if (!dataFromDB[section][subtype]) {
    dataFromDB[section][subtype] = {}
  }

  if (!dataFromDB[section][subtype][geotype]) {
    dataFromDB[section][subtype][geotype] = {}
  }
  Object.entries(obj).forEach(([key, value]) => {
    if (!dataFromDB[section][subtype][geotype][key]) {
      dataFromDB[section][subtype][geotype][key] = {}
    }
    Object.entries(value).forEach(([childKey, childValue]) =>{
      if (!dataFromDB[section][subtype][geotype][key][childKey] ) {
        dataFromDB[section][subtype][geotype][key][childKey] = {}
      }
      dataFromDB[section][subtype][geotype][key][childKey][`${year}-${quarter.toUpperCase()}`] = childValue
    })
  })
  return dataFromDB;

};

const updateByObjectKeys = ({
  dataFromDB,
  mapping: {
    geotype,
    section,
    indicator
  },
  obj
}) => {
  Object.entries(obj).forEach(([key, value]) => {

    if (!dataFromDB[section]) {
      dataFromDB[section] = {}
    }

    if (!dataFromDB[section][geotype]) {
      dataFromDB[section][geotype] = {}
    }

    if (!dataFromDB[section][geotype][indicator]) {
      dataFromDB[section][geotype][indicator] = {}
    }
    if (!dataFromDB[section][geotype][indicator][key]) {
      dataFromDB[section][geotype][indicator][key] = {}
    }
    Object.entries(value).forEach(([childKey, childValue]) =>
      dataFromDB[section][geotype][indicator][key][childKey] = childValue
    )
  })
  return dataFromDB;

};


const updateBySubtypeGeoTypeGeoWithValue = ({
  mapping: {
    year,
    quarter,
    section,
    geotype,
    geo,
    indicator,
    subtype
  },
  value,
  dataFromDB
}) => {
  // console.log(dataFromDB)
  if (!dataFromDB[section][subtype][geotype]) {
    dataFromDB[section][subtype][geotype] = {};
  }
  if (!dataFromDB[section][subtype][geotype][geo]) {
    dataFromDB[section][subtype][geotype][geo] = {};
  }
  if (!dataFromDB[section][subtype][geotype][geo][indicator]) {
    dataFromDB[section][subtype][geotype][geo][indicator] = {};
  }
  dataFromDB[section][subtype][geotype][geo][indicator][`${year}-${quarter.toUpperCase()}`] = value;
  return dataFromDB
};

module.exports = {
  updateWithDataArrays,
  updatedWithObject,
  updateBySubtypeGeoTypeGeoWithValue,
  updateByObjectKeyYearQuarter,
  updateByObjectKeysYearQuarter,
  updateByObjectKeys,
  updateGeoJSONWithDataArrays
}