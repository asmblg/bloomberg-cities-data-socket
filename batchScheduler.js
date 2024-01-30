// const fs = require('fs');

function handleMapping (template, obj) {
  const modObj = {...template};

  Object.entries(obj).forEach(([key, value]) => {
    //CREATE CODE HERE TO CHECK IF VALUE US AN ARRAY OR OBJECTS
    if (Array.isArray(value)) {
      //CODE TO HANDLE ARRAY
    } else if (Object.keys(value)?.[0]) {
      console.log(value)
      Object.entries(value).forEach(([nestKey, nestValue]) => 
        modObj[key][nestKey] = nestValue
      )
      //CODE TO HANDLE OBJECt
    } else {
      modObj[key] = value
    }
  })
  return modObj
}

function mapTemplate(configArray, templates) {
    const array = [];
    templates.forEach(template => 
      configArray.forEach(obj => {
        const modObj = handleMapping(template,obj)
        array.push(modObj)
          // return template.replace(/\${(.*?)}/g, (match, key) => obj[key.trim()] || match);
      })
    )
    return array; 
}

// Import the template from the JSON file
const templateJson = require('./configs/templates/Safegraph-Raw-Places.json');
const templates = templateJson;

// Example Usage
const configArray = [];
const dates = ['2024-02-15', '2024-05-15', '2024-08-15', '2024-11-15' ]; // PUT ALL SCHEDULE DATES HERE

// MODIFY CODE HERE TO MAP IN OTHER PARAMETERS
dates.forEach((date, i) => 
  configArray.push(
    {
      "scheduleDate": new Date(date),
      "rawDataUpdateConfig": {
        "sourceDirectory": `API-${date}`
      }
    }
  ))
console.log(configArray)



const result = mapTemplate(configArray, templates);
console.log(result);
