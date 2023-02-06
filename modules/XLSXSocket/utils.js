const http = require('https');
const axios = require('axios');
const qs = require('qs');

const getToken = async ({clientID, clientSecret}) => {
  return new Promise((resolve) => {
    const postData = {
      client_id: clientID,
      scope: 'https://graph.microsoft.com/.default',
      client_secret: clientSecret,
      grant_type: 'client_credentials'
    };
    const url = 'https://login.microsoftonline.com/e430c0e6-4aaf-41bf-a0e8-9563befd30df/oauth2/v2.0/token'

    axios.defaults.headers.post['Content-Type'] =
      'application/x-www-form-urlencoded';

    axios
      .post(url, qs.stringify(postData))
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.log(error);
      });
  });
}

const fetchFromOneDrive = async ({
  drive = "users/69202113-5dc8-4f66-babc-c87485e06a1e/drive",
  file,
  sheet,
  directory,
  accessToken
}) => {

  return new Promise((resolve) => {
    const options = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Cache-Control": "no-cache",
      },
    };

    const query = !directory
      ? `${file}/workbook/worksheets('${sheet}')/usedRange`
      : `${directory}/children`
    const url = `https://graph.microsoft.com/v1.0/${drive}/items/${query}`

    const req = http.get(url, options, (res) => {
      const chunks = [];

      res.on("data", (chunk) => {
        chunks.push(chunk);
      });

      res.on("end", () => {
        const body = Buffer.concat(chunks);
        const json = JSON.parse(body.toString());

        if (json.error) {
          throw new Error(json.error.message || "Request error");
        }

        resolve(!directory ? json.values : json.value);
      });
    });

    req.end();
  });
};

const parseXLSX = async ({
  mappings,
  worksheet
}) => {
  const resultsArray = [];

  mappings.forEach(({
    destination,
    origin: {
      rowIndex,
      columnIndex,
      rowIndexStart,
      rowIndexEnd,
      keyColumnIndex,
      dataColumnIndex
    }
  }) => {
    if (rowIndex) {
      resultsArray.push({
        ...destination,
        value: worksheet[rowIndex][columnIndex]
      })
    };
    if (rowIndexStart && rowIndexEnd) {
      const obj = {};
      const rows = worksheet
        .filter((item, i) =>
          i >= rowIndexStart &&
          i <= rowIndexEnd
        );
      rows.forEach((row) =>
        obj[row[keyColumnIndex]] = row[dataColumnIndex]
      );
      resultsArray.push({
        ...destination,
        value: obj
      });
    }
  })
  return resultsArray;
};

const mapInNewData = async ({
  parsedData, 
  currentData,
}) => {
  const obj = { ...currentData };

  parsedData.forEach(
    ({ geo, category, indicator, year, value }) => {
      if (!obj[geo]) {
        obj[geo] = {}
      }
      if (!obj[geo][category]) {
        obj[geo][category] = {}
      }
      if (!obj[geo][category][indicator]) {
        obj[geo][category][indicator] = {};
      }
      obj[geo][category][indicator][year] = value
    }
  );
  return obj;
}

module.exports = {
  parseXLSX,
  mapInNewData,
  getToken,
  fetchFromOneDrive
}