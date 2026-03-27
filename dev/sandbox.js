// require('dotenv').config();
const util = require('util');
// const shapefileToGeojson = require("shapefile-to-geojson");
// const { MongoClient } = require('mongodb');
// const turf = require('@turf/turf');


// const { readdir } = require('fs/promises');
// const {
//   gzipToMongoDB, 
//   getFileLinks, 
//   downloadFiles,
//   // deleteRecords
// } = require('./modules/SafeGraphSocket/utils');

//  GET GEOJSONS -> https://hanshack.com/geotools/gimmegeodata/

const run = async () => {

  // const client = await MongoClient.connect(
  //   process.env.MONGODB_URI,
  //   { useNewUrlParser: true, useUnifiedTopology: true }
  // );
  // const db = client.db('bloomberg-dev');
  // const dataCollection = db.collection('data');
  // const geoCollection = db.collection('geos');
  // const socketCollection = db.collection('sockets');

  // // ***SCHEDULE SOCKETS***

  // const socketJSON = 'DataAxel.json';
  // const scheduleDate = '2023-4-15'

  // const configArray = require(`./configs/scheduled/${socketJSON}`);

  // for await (socketConfig of configArray) {
  //   await socketCollection.insertOne({
  //     ...socketConfig,
  //     scheduleDate: new Date(scheduleDate)
  //   })

  //   const {
  //     project,
  //     type,
  //     description
  //   } = socketConfig;

  //   console.log(project, type, description)
  //   console.log('Scheduled for:', scheduleDate)
  // }

  // ***FILTER FEATURES IN GEOS COLLECTION***
  // const project = 'Tampa'
  // const cityGeoJSON = await geoCollection.findOne({
  //   project,
  //   geoType: 'City Boundary'
  // });

  // const tractGeoJSON = await geoCollection.findOne({
  //   project,
  //   geoType: 'Census Tracts'
  // });

  // const filteredFeatures = [];

  // tractGeoJSON.features.forEach(feature => {
  //   if (cityGeoJSON.features[0].geometry.type !== 'MultiPolygon') {
  //     if (
  //       turf.booleanContains(cityGeoJSON.features[0], feature) || 
  //       turf.booleanIntersects(cityGeoJSON.features[0], feature)
  //     ) {
  //       filteredFeatures.push(feature)
  //     }
  //   } else {
  //     let containsOrIntersects = false;
  //     cityGeoJSON.features[0].geometry.coordinates.forEach(coordinateArray =>{
  //       const polygon = turf.polygon(coordinateArray);
  //       if (
  //         turf.booleanContains(polygon, feature) || 
  //         turf.booleanIntersects(polygon, feature)  
  //       ) {
  //         containsOrIntersects = true
  //       }
  //     });
  //     if (containsOrIntersects) {
  //       filteredFeatures.push(feature)
  //     }
  //   }
  // });

  // const res = await geoCollection.findOneAndUpdate(
  //   {
  //     project,
  //     geoType: 'Census Tracts'
  //   }, {
  //     $set: {
  //       features: filteredFeatures, 
  //       updatedOn: new Date()
  //     }    
  //   }, {
  //     upsert: true
  //   })

  // ***SHAPEFILE TO GEOS COLLECTION***
  // const rawGeoJSON = await shapefileToGeojson.parseFolder('./data/geos/cb_2021_04_tract_500k'); // This directory should include 1 `shp` & 1 `dbf` file 

  // const processedGeoJSON = {
  //   project: 'Tampa',
  //   geoType: 'City',
  //   type: "FeatureCollection",
  //   features: []
  // };

  // const project = 'Phoenix'

  // const tractNames = {

  // }
  
  // rawGeoJSON.features.forEach(({type, geometry, properties}) => {
  //   const countyFIP = properties['COUNTYFP'].toString().padStart(3,0);

  //   if (countyFIP === '013') {

  //     const stateFIP = properties['STATEFP'].toString().padStart(2,0);
  //     const tractFIP = properties['TRACTCE'].toString().padStart(6,0);
  //     const geoid = `${stateFIP}${countyFIP}${tractFIP}`;
  //     tractNames[geoid] = properties['NAMELSAD']


  //     //   const feature = {
  //     //   type,
  //     //   geometry,
  //     //   properties : {}
  //     // };

  //     // feature.properties['GEOID'] = `${stateFIP}${countyFIP}${tractFIP}`;
  //     // processedGeoJSON.features.push(feature);
  //   }
  // });

  // console.log(tractNames);

  //   const tractGeoJSON = await geoCollection.findOne({
  //   project,
  //   geoType: 'Census Tracts'
  // });

  // const modifiedFeatures = tractGeoJSON.features.map(feature => {
  //   feature.properties['Name'] = tractNames[feature.properties['GEOID']]
  //   return feature;
  // });

  // console.log(modifiedFeatures)


  // const res = await geoCollection.findOneAndUpdate(
  //   {
  //     project,
  //     geoType: 'Census Tracts'
  //   }, {
  //     $set: {
  //       features: modifiedFeatures, 
  //       updatedOn: new Date()
  //     }    
  //   }, {
  //     upsert: true
  //   })



  // console.log(res)

  // const res = await geoCollection.insertOne(processedGeoJSON);



  const areas = {
    'Chicago-Naperville-Elgin, IL-IN-WI Metropolitan Statistical Area': 'chicago',
    'Dallas-Plano-Irving, TX Metropolitan Division': 'dallas',
    'Denver-Aurora-Lakewood, CO Metropolitan Statistical Area': 'denver',
    'Los Angeles-Long Beach-Anaheim, CA Metropolitan Statistical Area': 'la',
    'Phoenix-Mesa-Scottsdale, AZ Metropolitan Statistical Area': 'phoenix',
    'Salt Lake City, UT Metropolitan Statistical Area': 'saltlake',
    'Chicago-Naperville-Arlington Heights, IL Metropolitan Division': 'chicago',
    'Dallas-Fort Worth-Arlington, TX Metropolitan Statistical Area': 'dallas',
    'Phoenix-Mesa-Scottsdale, AZ': 'phoenix',
    'Dallas-Fort Worth-Arlington, TX': 'dallas',
    'Denver-Aurora-Lakewood, CO': 'denver',
    'Los Angeles-Long Beach-Anaheim, CA': 'la',
    'Salt Lake City, UT': 'saltlake',
    'Atlanta-Sandy Springs-Roswell, GA Metropolitan Statistical Area': 'atlanta',
    'Austin-Round Rock, TX Metropolitan Statistical Area': 'austin',
    'Charlotte-Concord-Gastonia, NC-SC Metropolitan Statistical Area': 'charlotte',
    'Orlando-Kissimmee-Sanford, FL Metropolitan Statistical Area': 'orlando',
    'Tampa-St. Petersburg-Clearwater, FL Metropolitan Statistical Area': 'tampa',
    'Atlanta-Sandy Springs-Roswell, GA': 'atlanta',
    'Orlando-Kissimmee-Sanford, FL': 'orlando',
    'Tampa-St. Petersburg-Clearwater, FL': 'tampa',
    'Austin-Round Rock, TX': 'austin',
    'Charlotte-Concord-Gastonia, NC-SC': 'charlotte',
    'Pittsburgh, PA': 'pittsburgh',
    'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD': 'philadelphia',
    'Detroit-Warren-Dearborn, MI': 'detroit',
    'Virginia Beach-Norfolk-Newport News, VA-NC': 'virginia-beach',
    'Baltimore-Columbia-Towson, MD': 'baltimore',
    'Milwaukee-Waukesha-West Allis, WI': 'milwaukee'
  },
  descriptions = {
    'Employment: Chicago-Naperville-Elgin, IL-IN-WI Metropolitan Statistical Area (U)': 'total',
    'Employment: Dallas-Plano-Irving, TX Metropolitan Division (U)': 'total',
    'Unemployment Rate: Denver-Aurora-Lakewood, CO Metropolitan Statistical Area (U)': 'unemployment',
    'Employment: Los Angeles-Long Beach-Anaheim, CA Metropolitan Statistical Area (U)': 'total',
    'Employment: Phoenix-Mesa-Scottsdale, AZ Metropolitan Statistical Area (U)': 'total',
    'Employment: Salt Lake City, UT Metropolitan Statistical Area (U)': 'total',
    'Unemployment Rate: Chicago-Naperville-Elgin, IL-IN-WI Metropolitan Statistical Area (U)': 'unemployment',
    'Unemployment Rate: Dallas-Fort Worth-Arlington, TX Metropolitan Statistical Area (U)': 'unemployment',
    'Unemployment Rate: Los Angeles-Long Beach-Anaheim, CA Metropolitan Statistical Area (U)': 'unemployment',
    'Unemployment Rate: Phoenix-Mesa-Scottsdale, AZ Metropolitan Statistical Area (U)': 'unemployment',
    'Unemployment Rate: Salt Lake City, UT Metropolitan Statistical Area (U)': 'unemployment',
    'Employed and Office of Employment and Unemployment Statistics : Construction - Construction': 'construction',
    'Employed and Office of Employment and Unemployment Statistics : Education and Health Services - Education and Health Services': 'educationhealth',
    'Employed and Office of Employment and Unemployment Statistics : Financial Activities - Financial Activities': 'financial',
    'Employed and Office of Employment and Unemployment Statistics : Government - Government': 'government',
    'Employed and Office of Employment and Unemployment Statistics : Information - Information': 'information',
    'Employed and Office of Employment and Unemployment Statistics : Leisure and Hospitality - Leisure and Hospitality': 'leisure',
    'Employed and Office of Employment and Unemployment Statistics : Manufacturing - Manufacturing': 'manufacturing',
    'Employed and Office of Employment and Unemployment Statistics : Mining and Logging - Mining and Logging': 'mining',
    'Employed and Office of Employment and Unemployment Statistics : Mining, Logging, and Construction - Mining, Logging and Construction': 'miningconstruction',
    'Employed and Office of Employment and Unemployment Statistics : Other Services - Other Services': 'other',
    'Employed and Office of Employment and Unemployment Statistics : Professional and Business Services - Professional and Business Services': 'professional',
    'Employed and Office of Employment and Unemployment Statistics : Trade, Transportation, and Utilities - Trade, Transportation, and Utilities': 'transportation',
    'Employment: Atlanta-Sandy Springs-Roswell, GA Metropolitan Statistical Area (U)': 'total',
    'Employment: Austin-Round Rock, TX Metropolitan Statistical Area (U)': 'total',
    'Employment: Charlotte-Concord-Gastonia, NC-SC Metropolitan Statistical Area (U)': 'total',
    'Employment: Denver-Aurora-Lakewood, CO Metropolitan Statistical Area (U)': 'total',
    'Employment: Orlando-Kissimmee-Sanford, FL Metropolitan Statistical Area (U)': 'total',
    'Employment: Tampa-St. Petersburg-Clearwater, FL Metropolitan Statistical Area (U)': 'total',
    'Unemployment Rate: Atlanta-Sandy Springs-Roswell, GA Metropolitan Statistical Area (U)': 'unemployment',
    'Unemployment Rate: Austin-Round Rock, TX Metropolitan Statistical Area (U)': 'unemployment',
    'Unemployment Rate: Charlotte-Concord-Gastonia, NC-SC Metropolitan Statistical Area (U)': 'unemployment',
    'Unemployment Rate: Orlando-Kissimmee-Sanford, FL Metropolitan Statistical Area (U)': 'unemployment',
    'Unemployment Rate: Tampa-St. Petersburg-Clearwater, FL Metropolitan Statistical Area (U)': 'unemployment',
    'All - Total employment': 'total',
    'All - Unemployment rate': 'unemployment',
    'Construction - Total employment': 'construction',
    'Education and Health Services - Total employment': 'educationhealth',
    'Financial Activities - Total employment': 'financial',
    'Government - Total employment': 'government',
    'Information - Total employment': 'information',
    'Leisure and Hospitality - Total employment': 'leisure',
    'Manufacturing - Total employment': 'manufacturing',
    'Mining and Logging - Total employment': 'mining',
    'Other Services - Total employment': 'other',
    'Professional and Business Services - Total employment': 'professional',
    'Trade, Transportation, and Utilities - Total employment': 'transportation',
    'Mining, Logging and Construction - Total employment' : 'miningconstruction'
  }, 
  series = [
    {
      "seriesID": "LAUMT423830000000005",
      "area": "Pittsburgh, PA",
      "Name": "Employment",
      "Industry": "All",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "LAUMT423830000000003",
      "area": "Pittsburgh, PA",
      "Name": "Unemployment rate",
      "Industry": "All",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Unemployment rate",
      "Note": ""
    },
    {
      "seriesID": "SMU42383002000000001",
      "area": "Pittsburgh, PA",
      "Name": "Employment",
      "Industry": "Construction",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": "Add up 'Mining and Logging' with 'Construction' to be in the same category"
    },
    {
      "seriesID": "SMU42383006500000001",
      "area": "Pittsburgh, PA",
      "Name": "Employment",
      "Industry": "Education and Health Services",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU42383005500000001",
      "area": "Pittsburgh, PA",
      "Name": "Employment",
      "Industry": "Financial Activities",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU42383009000000001",
      "area": "Pittsburgh, PA",
      "Name": "Employment",
      "Industry": "Government",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU42383005000000001",
      "area": "Pittsburgh, PA",
      "Name": "Employment",
      "Industry": "Information",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU42383007000000001",
      "area": "Pittsburgh, PA",
      "Name": "Employment",
      "Industry": "Leisure and Hospitality",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU42383003000000001",
      "area": "Pittsburgh, PA",
      "Name": "Employment",
      "Industry": "Manufacturing",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU42383001000000001",
      "area": "Pittsburgh, PA",
      "Name": "Employment",
      "Industry": "Mining and Logging",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": "Add up 'Mining and Logging' with 'Construction' to be in the same category"
    },
    {
      "seriesID": "SMU42383008000000001",
      "area": "Pittsburgh, PA",
      "Name": "Employment",
      "Industry": "Other Services",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU42383006000000001",
      "area": "Pittsburgh, PA",
      "Name": "Employment",
      "Industry": "Professional and Business Services",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU42383004000000001",
      "area": "Pittsburgh, PA",
      "Name": "Employment",
      "Industry": "Trade, Transportation, and Utilities",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "LAUMT423798000000005",
      "area": "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD",
      "Name": "Employment",
      "Industry": "All",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "LAUMT423798000000003",
      "area": "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD",
      "Name": "Unemployment rate",
      "Industry": "All",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Unemployment rate",
      "Note": ""
    },
    {
      "seriesID": "SMU42379806500000001",
      "area": "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD",
      "Name": "Employment",
      "Industry": "Education and Health Services",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU42379805500000001",
      "area": "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD",
      "Name": "Employment",
      "Industry": "Financial Activities",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU42379809000000001",
      "area": "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD",
      "Name": "Employment",
      "Industry": "Government",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU42379805000000001",
      "area": "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD",
      "Name": "Employment",
      "Industry": "Information",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU42379807000000001",
      "area": "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD",
      "Name": "Employment",
      "Industry": "Leisure and Hospitality",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU42379803000000001",
      "area": "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD",
      "Name": "Employment",
      "Industry": "Manufacturing",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU42379801500000001",
      "area": "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD",
      "Name": "Employment",
      "Industry": "Mining, Logging and Construction",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU42379808000000001",
      "area": "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD",
      "Name": "Employment",
      "Industry": "Other Services",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU42379806000000001",
      "area": "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD",
      "Name": "Employment",
      "Industry": "Professional and Business Services",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU42379804000000001",
      "area": "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD",
      "Name": "Employment",
      "Industry": "Trade, Transportation, and Utilities",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "LAUMT261982000000005",
      "area": "Detroit-Warren-Dearborn, MI",
      "Name": "Employment",
      "Industry": "All",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "LAUMT261982000000003",
      "area": "Detroit-Warren-Dearborn, MI",
      "Name": "Unemployment rate",
      "Industry": "All",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Unemployment rate",
      "Note": ""
    },
    {
      "seriesID": "SMU26198206500000001",
      "area": "Detroit-Warren-Dearborn, MI",
      "Name": "Employment",
      "Industry": "Education and Health Services",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU26198205500000001",
      "area": "Detroit-Warren-Dearborn, MI",
      "Name": "Employment",
      "Industry": "Financial Activities",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU26198209000000001",
      "area": "Detroit-Warren-Dearborn, MI",
      "Name": "Employment",
      "Industry": "Government",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU26198205000000001",
      "area": "Detroit-Warren-Dearborn, MI",
      "Name": "Employment",
      "Industry": "Information",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU26198207000000001",
      "area": "Detroit-Warren-Dearborn, MI",
      "Name": "Employment",
      "Industry": "Leisure and Hospitality",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU26198203000000001",
      "area": "Detroit-Warren-Dearborn, MI",
      "Name": "Employment",
      "Industry": "Manufacturing",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU26198201500000001",
      "area": "Detroit-Warren-Dearborn, MI",
      "Name": "Employment",
      "Industry": "Mining, Logging and Construction",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU26198208000000001",
      "area": "Detroit-Warren-Dearborn, MI",
      "Name": "Employment",
      "Industry": "Other Services",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU08197406000000001",
      "area": "Detroit-Warren-Dearborn, MI",
      "Name": "Employment",
      "Industry": "Professional and Business Services",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU26198204000000001",
      "area": "Detroit-Warren-Dearborn, MI",
      "Name": "Employment",
      "Industry": "Trade, Transportation, and Utilities",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "LAUMT514726000000005",
      "area": "Virginia Beach-Norfolk-Newport News, VA-NC",
      "Name": "Employment",
      "Industry": "All",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "LAUMT514726000000003",
      "area": "Virginia Beach-Norfolk-Newport News, VA-NC",
      "Name": "Unemployment rate",
      "Industry": "All",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Unemployment rate",
      "Note": ""
    },
    {
      "seriesID": "SMU51472606500000001",
      "area": "Virginia Beach-Norfolk-Newport News, VA-NC",
      "Name": "Employment",
      "Industry": "Education and Health Services",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU51472605500000001",
      "area": "Virginia Beach-Norfolk-Newport News, VA-NC",
      "Name": "Employment",
      "Industry": "Financial Activities",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU51472601500000001",
      "area": "Virginia Beach-Norfolk-Newport News, VA-NC",
      "Name": "Employment",
      "Industry": "Mining, Logging and Construction",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "No",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU51472609000000001",
      "area": "Virginia Beach-Norfolk-Newport News, VA-NC",
      "Name": "Employment",
      "Industry": "Government",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU51472605000000001",
      "area": "Virginia Beach-Norfolk-Newport News, VA-NC",
      "Name": "Employment",
      "Industry": "Information",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU51472607000000001",
      "area": "Virginia Beach-Norfolk-Newport News, VA-NC",
      "Name": "Employment",
      "Industry": "Leisure and Hospitality",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU51472603000000001",
      "area": "Virginia Beach-Norfolk-Newport News, VA-NC",
      "Name": "Employment",
      "Industry": "Manufacturing",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU51472608000000001",
      "area": "Virginia Beach-Norfolk-Newport News, VA-NC",
      "Name": "Employment",
      "Industry": "Other Services",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU51472606000000001",
      "area": "Virginia Beach-Norfolk-Newport News, VA-NC",
      "Name": "Employment",
      "Industry": "Professional and Business Services",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU51472604000000001",
      "area": "Virginia Beach-Norfolk-Newport News, VA-NC",
      "Name": "Employment",
      "Industry": "Trade, Transportation, and Utilities",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "LAUMT241258000000005",
      "area": "Baltimore-Columbia-Towson, MD",
      "Name": "Employment",
      "Industry": "All",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "No",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "LAUMT241258000000003",
      "area": "Baltimore-Columbia-Towson, MD",
      "Name": "Unemployment rate",
      "Industry": "All",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "No",
      "description": "Unemployment rate",
      "Note": ""
    },
    {
      "seriesID": "SMU24125801500000001",
      "area": "Baltimore-Columbia-Towson, MD",
      "Name": "Employment",
      "Industry": "Mining, Logging and Construction",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "No",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU24125806500000001",
      "area": "Baltimore-Columbia-Towson, MD",
      "Name": "Employment",
      "Industry": "Education and Health Services",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "No",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU24125805500000001",
      "area": "Baltimore-Columbia-Towson, MD",
      "Name": "Employment",
      "Industry": "Financial Activities",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "No",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU24125809000000001",
      "area": "Baltimore-Columbia-Towson, MD",
      "Name": "Employment",
      "Industry": "Government",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "No",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU24125805000000001",
      "area": "Baltimore-Columbia-Towson, MD",
      "Name": "Employment",
      "Industry": "Information",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "No",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU24125807000000001",
      "area": "Baltimore-Columbia-Towson, MD",
      "Name": "Employment",
      "Industry": "Leisure and Hospitality",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "No",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU24125803000000001",
      "area": "Baltimore-Columbia-Towson, MD",
      "Name": "Employment",
      "Industry": "Manufacturing",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "No",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU24125808000000001",
      "area": "Baltimore-Columbia-Towson, MD",
      "Name": "Employment",
      "Industry": "Other Services",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "No",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU24125806000000001",
      "area": "Baltimore-Columbia-Towson, MD",
      "Name": "Employment",
      "Industry": "Professional and Business Services",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "No",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU24125804000000001",
      "area": "Baltimore-Columbia-Towson, MD",
      "Name": "Employment",
      "Industry": "Trade, Transportation, and Utilities",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "No",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "LAUMT553334000000005",
      "area": "Milwaukee-Waukesha-West Allis, WI",
      "Name": "Employment",
      "Industry": "All",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "LAUMT553334000000003",
      "area": "Milwaukee-Waukesha-West Allis, WI",
      "Name": "Unemployment rate",
      "Industry": "All",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Unemployment rate",
      "Note": ""
    },
    {
      "seriesID": "SMU55333406500000001",
      "area": "Milwaukee-Waukesha-West Allis, WI",
      "Name": "Employment",
      "Industry": "Education and Health Services",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU55333402000000001",
      "area": "Milwaukee-Waukesha-West Allis, WI",
      "Name": "Employment",
      "Industry": "Construction",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": "Add up 'Mining and Logging' with 'Construction' to be in the same category"
    },
    {
      "seriesID": "SMU55333405500000001",
      "area": "Milwaukee-Waukesha-West Allis, WI",
      "Name": "Employment",
      "Industry": "Financial Activities",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU55333409000000001",
      "area": "Milwaukee-Waukesha-West Allis, WI",
      "Name": "Employment",
      "Industry": "Government",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU55333405000000001",
      "area": "Milwaukee-Waukesha-West Allis, WI",
      "Name": "Employment",
      "Industry": "Information",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU55333407000000001",
      "area": "Milwaukee-Waukesha-West Allis, WI",
      "Name": "Employment",
      "Industry": "Leisure and Hospitality",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU55333403000000001",
      "area": "Milwaukee-Waukesha-West Allis, WI",
      "Name": "Employment",
      "Industry": "Manufacturing",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU55333401000000001",
      "area": "Milwaukee-Waukesha-West Allis, WI",
      "Name": "Employment",
      "Industry": "Mining and Logging",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": "Add up 'Mining and Logging' with 'Construction' to be in the same category"
    },
    {
      "seriesID": "SMU55333408000000001",
      "area": "Milwaukee-Waukesha-West Allis, WI",
      "Name": "Employment",
      "Industry": "Other Services",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU55333406000000001",
      "area": "Milwaukee-Waukesha-West Allis, WI",
      "Name": "Employment",
      "Industry": "Professional and Business Services",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    },
    {
      "seriesID": "SMU55333404000000001",
      "area": "Milwaukee-Waukesha-West Allis, WI",
      "Name": "Employment",
      "Industry": "Trade, Transportation, and Utilities",
      "Timeframe": "Jan 2021-Latest",
      "Benchmark city": "Yes",
      "description": "Total employment",
      "Note": ""
    }
  ],
  array = [];

  // console.log(
  //   [...new Set(series.map(({Industry,description}) => `${Industry} - ${description}`))]
  // )

    // configs.filter(({project}) => project === 'Tampa')
  
  // series.forEach(({tables}) =>
    series.forEach(({seriesID, description, area, Industry}) => {
      const indicator = `${Industry} - ${description}`
      const areaKey = areas[area];
      const indicatorKey = descriptions[indicator];

      array.push({
        seriesID,
        description: indicator,
        area,
        mapping:  {
          "geo": areaKey,
          "geotype": "msa",
          "section": "jobs",
          "indicator": indicatorKey
        }
      })
    })  
  // );

  // const result = {areas, descriptions};

  console.log('Done!\n', util.inspect(array, false, null, true));


};


run().then(() => process.exit(0))
