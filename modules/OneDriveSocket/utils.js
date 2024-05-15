const http = require('https');
const axios = require('axios');
const numeral = require('numeral')

const qs = require('qs');

const getToken = async ({ clientID, clientSecret }) => {
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
  drive = `users/${process.env.MS_USER_ID}/drive`,
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
  worksheet,
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
      dataColumnIndex,
      rowSearch
    }
  }) => {
    if (rowSearch) {
    }
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
};

const formatLabel = ({label, labelFormatter}) => {
  if (labelFormatter === 'YYYY QQ M to QQ YYYY') {
    const [year, quarter] = label.split(' ');
    return `${quarter} ${year}`;
  }
  if (labelFormatter?.method === 'slice') {
    const [start,end] = labelFormatter?.argument;
    return label.slice(start, end);
  }
}

const processData = ({mappings, worksheet}) => {
  const result = {};
  mappings.forEach(mapping => {
    const {
      origin: {
        rowSearch,
        rowCount,
        labelColumn,
        valueColumn,
        endSearch,
        excludeKeys,
        groupColumn,
        labelFormatter,
        filter,
        filter2,
        labelField,
        groupField,
        valueField,
        groupValueSplitter,
        countRows,
        nullGroup,
        countUniqueField,
        countUniqueColumn,
        valueCalculator,
        valueFormatter
      }, 
      destination: {
        indicator,
        quarter
      }} = mapping;

    // console.log(mapping);
    
    let startRowIndex = null;
    let endRowIndex = null;

    const headerRow = worksheet[0]
    .map(cell => `${cell}`
    // .toLocaleLowerCase()
    .trim());

    const labelIndex = labelField ? headerRow.indexOf(labelField) > -1 ? headerRow.indexOf(labelField) : labelColumn : null;
    const valueIndex = headerRow.indexOf(valueField) > -1 ? headerRow.indexOf(valueField) : valueColumn;
    const groupIndex = headerRow.indexOf(groupField) > -1 ? headerRow.indexOf(groupField) : groupColumn;
    const countUniqueIndex = headerRow.indexOf(countUniqueField) > -1 ? headerRow.indexOf(countUniqueField) : countUniqueColumn;
    const objectForCheckingUniqueCount = {};

    if (rowSearch && labelIndex) {
      worksheet.forEach((row, i) => {
        row.forEach(cell => { 
          if (`${cell}`.search(rowSearch) !== -1) {
            startRowIndex = i + 2
          }
        })
        if (startRowIndex && !endRowIndex && row[labelIndex] === endSearch) {
          endRowIndex = i
        }
      });
    }

    if (rowCount && !endRowIndex) {
      endRowIndex = startRowIndex + rowCount
    };

    const slicedRows = startRowIndex && endRowIndex 
      ? worksheet.slice(startRowIndex, endRowIndex)
      : worksheet;
    
    // console.log(slicedRows)

    const filterIndex =  filter?.field && headerRow.indexOf(filter?.field) > -1 
      ? headerRow.indexOf(filter?.field) 
      : filter?.column;
    
    const filterIndex2 = filter2?.field && headerRow.indexOf(filter2?.field) > -1 
    ? headerRow.indexOf(filter2?.field) 
    : filter2?.column;

    // console.log(slicedRows);

    slicedRows
    .filter(row => labelIndex ? !excludeKeys?.includes(row[labelIndex]?.trim()) : true)
    .filter(row => filter 
      ? filter.value 
        ? row[filterIndex]?.trim() === filter.value
        : filter.values
          ? filter.values.includes(row[filterIndex]?.trim())
          : true 
      : true)
    .filter(row => filter2 
      ? filter2.value 
        ? row[filterIndex2]?.trim() === filter2.value
        : filter2.values
          ? filter2.values.includes(row[filterIndex2]?.trim())
          : true 
      : true)
    .forEach(row => {
      // console.log(row);
      const countUniqueValue = row[countUniqueIndex];

      const label = labelIndex || labelIndex === 0
        ? labelFormatter 
          ? formatLabel({
              label: row[labelIndex]?.trim(), 
              labelFormatter
            })
          : `${row[labelIndex]?.trim()}`
        : null;
      let value = valueIndex 
          ? Number(row[valueIndex] || 0) 
        : countRows
          ? !objectForCheckingUniqueCount?.[label]?.includes(`${countUniqueValue}`.toUpperCase().trim())
            ? 1 : 0 
            : null;

      if (valueCalculator && !isNaN(parseInt(value))) {
        if (valueCalculator === 'inversePercentage')
        value = 1 - value
      }

      if (valueFormatter && !isNaN(parseInt(value))) {
        value = numeral(value).format(valueFormatter)
      }

      if (quarter ) {
        value = {[quarter]: value}
      }
      const group = groupValueSplitter 
        ? row[groupIndex].split(groupValueSplitter)
        : row[groupIndex] !== ''
          ? row[groupIndex]
          : nullGroup || '';
      

      if (label !== '' && labelIndex && (valueIndex || countRows)) {

        if (!result[indicator]) {
          result[indicator] = {}
        }
        if (!result[indicator][label]) {
          if ((groupIndex || groupIndex === 0) && group !== '') {
            result[indicator][label] = {};
            result[indicator][label][group] = value
          } else if (!(groupIndex || groupIndex === 0)) {
            result[indicator][label] = value
          }
        } else {
          if ((groupIndex || groupIndex === 0) && (group !== '')) {
            if (!result[indicator][label][group]) {
              result[indicator][label][group] = value
            } else {
              result[indicator][label][group] += value
            }
          } else if (!groupIndex) {
            result[indicator][label] += value
          }
        }
        
        if (!objectForCheckingUniqueCount[label]) {
          objectForCheckingUniqueCount[label] = []
        }
        if (objectForCheckingUniqueCount[label]) {
          objectForCheckingUniqueCount[label].push(`${countUniqueValue}`.toUpperCase().trim())
        }
      } else if (groupIndex || groupIndex === 0) {
        if (!result[indicator]) {
          result[indicator] = {}
        }
        if (groupValueSplitter && group?.[0] !== '') {
          group.forEach(g =>{
            if (!result[indicator][g]) {
              result[indicator][g] = value || 1      
            } else {
              result[indicator][g] += value || 1
            }          
          })
        }
        if (!groupValueSplitter && group !== '') {
          if (!result[indicator][group]) {
            result[indicator][group] = value || 1      
          } else {
            result[indicator][group] += value || 1
          }       
        }
      } else if (!labelIndex) {
        if (result?.[indicator]?.[quarter]) {
          // if (result[indicator][quarter]) {
            result[indicator][quarter] += value[quarter]
          // }
        } else {
          result[indicator] = value
        }
      }
    })

    // console.log(objectForCheckingUniqueCount);

  });

  // console.log(result);

  return result;
}

const runCalculations = ({mappings, result}) => {
  mappings.forEach(mapping => {
    const {
      origin: {
        calculations
      }, 
      destination: {
        indicator
      }} = mapping;
  
    if (calculations) {
      calculations.forEach(({
        type,
        groups,
        divisor
      }) => {
        if (type ==='group') {
          const groupedObj = {};
          Object.entries(result[indicator]).forEach(([key,value]) =>
            Object.entries(groups).forEach(([groupKey, groupArray]) => {
              if (groupArray.includes(key)) {
                if (!groupedObj[groupKey]) {
                  groupedObj[groupKey] = value
                } else {
                  groupedObj[groupKey] += value
                }
              }
            })
          )
          result[indicator] = groupedObj;
        }
        if (type === 'percentOfTotal') {
          const total = Object.values(result[indicator]).reduce((a,b) => a + b, 0);
          result[indicator] = (result[indicator][divisor] / total) * 100;
        }
      })
    }
  })
  return result;
}

module.exports = {
  parseXLSX,
  mapInNewData,
  getToken,
  fetchFromOneDrive,
  processData,
  runCalculations
}