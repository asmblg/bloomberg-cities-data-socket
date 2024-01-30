const { google } = require('googleapis');

module.exports = {

  get: async ({ 
    sheetID, 
    range, 
    columnHeaderIndex,
    rowHeaderIndex,
    dataIndexStart,
    dataIndexEnd
  }) => {
    const auth = new google.auth.GoogleAuth({
      keyFile: "googlekeys.json", //the key file
      //url to spreadsheets API
      scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    //Auth client Object
    const authClientObject = await auth.getClient();

    //Google sheets instance
    const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });

    // spreadsheet id
    const spreadsheetId = sheetID;

    //Read front the spreadsheet
    const {data} = await googleSheetsInstance.spreadsheets.values.get({
      auth, //auth object
      spreadsheetId, // spreadsheet id
      range, //range of cells to read from.
    })


    const result = {};


    const headerArray = data.values[columnHeaderIndex];

    headerArray.forEach((headerValue, i) => {
      if (i >= dataIndexStart && i <= dataIndexEnd) {
        result[headerValue.replace(/ /g, '_')] = {}
      }
    })

    data.values.forEach((array,i) => {
      if (i > columnHeaderIndex) {
        const yearString = array[rowHeaderIndex].slice(0,2);
        const quarterString = array[rowHeaderIndex].slice(2)
        const rowKey = `20${yearString}-${quarterString}`;
        array.forEach((value, j) => {
          if (j >= dataIndexStart && j <= dataIndexEnd) {
            const indicator = headerArray[j];
            if (!result[indicator.replace(/ /g, '_')]) {
              result[indicator.replace(/ /g, '_')] = {}
            }
            result[indicator.replace(/ /g, '_')][rowKey] = value
          }
        })
      }
    })

    //send the data reae with the response
    return result;

  }
}