const http = require('https');
const axios = require('axios');
const numeral = require('numeral')

const qs = require('qs');
// const { replace } = require('lodash');
// const { count } = require('console');

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
  accessToken,
  fileType,
  delimiter
}) => {

  return new Promise((resolve) => {
    const customOptions = fileType === 'CSV'
      ? {
        responseType: 'text', // because we're getting CSV content
        maxRedirects: 5, // axios will follow redirects automatically
      }
      : {}

    const options = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Cache-Control": "no-cache",
      },
      ...customOptions
    };

    // const query = !directory
    //   ? fileType === 'XLSX' 
    //     ? `${file}/workbook/worksheets('${sheet}')/usedRange`
    //     : `${file}/content`
    //   : `${directory}/children`

    const query = directory
      ? `${directory}/children`
      : fileType === 'XLSX'
        ? `${file}/workbook/worksheets('${sheet}')/usedRange`
        : `${file}/content`;
    const url = `https://graph.microsoft.com/v1.0/${drive}/items/${query}`

    console.log(url);

    if (fileType === 'XLSX' || directory) {

      const req = http.get(url, options, (res) => {
        const chunks = [];

        // console.log(res.data);
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
    }

    if (fileType === 'CSV') {
      
      axios
        .get(url, options)
        .then((response) => {
          const csv = response.data;
          const cleanedCSV = csv.replace(/[ºª]/g, ''); // Remove the characters
          const rows = cleanedCSV.split('\n').map(row => {
            const result = [];
            let current = '';
            let insideQuotes = false;


            for (let i = 0; i < row.length; i++) {
              const char = row[i];

              if (char === '"' && row[i - 1] !== '\\') {
                insideQuotes = !insideQuotes;
              } else if (char === delimiter && !insideQuotes) {
                result.push(current);
                current = '';
              } else {
                current += char;
              }
            }

            result.push(current);
            return result;
          });
          // const headers = rows[0];
          // console.log(headers);
          // const json = rows.map((row, i) => {
          //   const obj = {};

          //   row.forEach((cell, j) => {
          //     obj[headers[j]] = cell;
          //   });
          //   return obj;
          // });
          resolve(rows);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  });
};

// const parseXLSX = async ({
//   mappings,
//   worksheet,
// }) => {
//   const resultsArray = [];

//   mappings.forEach(({
//     destination,
//     origin: {
//       rowIndex,
//       columnIndex,
//       rowIndexStart,
//       rowIndexEnd,
//       keyColumnIndex,
//       dataColumnIndex,
//       rowSearch
//     }
//   }) => {
//     if (rowSearch) {
//     }
//     if (rowIndex) {
//       resultsArray.push({
//         ...destination,
//         value: worksheet[rowIndex][columnIndex]
//       })
//     };
//     if (rowIndexStart && rowIndexEnd) {
//       const obj = {};
//       const rows = worksheet
//         .filter((item, i) =>
//           i >= rowIndexStart &&
//           i <= rowIndexEnd
//         );
//       rows.forEach((row) =>
//         obj[row[keyColumnIndex]] = row[dataColumnIndex]
//       );
//       resultsArray.push({
//         ...destination,
//         value: obj
//       });
//     }
//   })
//   return resultsArray;
// };

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

const formatLabel = ({ label, labelFormatter }) => {
  if (labelFormatter === 'YYYY QQ M to QQ YYYY') {
    const [year, quarter] = label.split(' ');
    return `${quarter} ${year}`;
  }
  if (labelFormatter === 'YYYY QQ M to YYYY-QQ') {
    const [year, quarter] = label.split(' ');
    if (year && quarter) {
    return `${year}-${quarter}`;
    } return null
  }

  if (labelFormatter === 'mmm/YYYY to YYYY-QQ') {
    const [month, year] = label.split('/');
    const monthMap = {
      'jan': 'Q1',
      'feb': 'Q1',
      'mar': 'Q1',
      'apr': 'Q2',
      'may': 'Q2',
      'jun': 'Q2',
      'jul': 'Q3',
      'aug': 'Q3',
      'sep': 'Q3',
      'oct': 'Q4',
      'nov': 'Q4',
      'dec': 'Q4'
    };
    if (month && year) {
      return `${year}-${monthMap[month]}`;
    }
    return null
  }


  if (labelFormatter?.method === 'slice') {
    const [start, end] = labelFormatter?.argument;
    return label.slice(start, end);
  }
  if (labelFormatter?.method === 'uppercase') {
    return label.toUpperCase();
  }
  return label;
}

const processData = ({ mappings, worksheet }) => {
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
        excludeGroups,
        groupColumn,
        labelFormatter,
        filter,
        filter2,
        labelField,
        groupField,
        valueField,
        groupValueSplitter,
        groupConverter,
        countRows,
        nullGroup,
        countUniqueField,
        countUniqueColumn,
        valueCalculator,
        valueFormatter,
        valueConverter,
        startRowOffset,
        replaceZeroWith,
        wholeTable
      },
      destination: {
        indicator,
        quarter
      } } = mapping;

    // console.log(mapping);

    let startRowIndex = null;
    let endRowIndex = null;

    const headerRow = worksheet[0]
      .map(cell => `${cell}`.toLowerCase()
        // .toLocaleLowerCase()
        .trim());

    const labelIndex = labelField
      ? headerRow.indexOf(labelField?.toLowerCase()) > -1
        ? headerRow.indexOf(labelField?.toLowerCase())
        : 0 // Assume first column if not specified 
      : labelColumn;
    const valueIndex = headerRow.indexOf(valueField?.toLowerCase()) > -1 ? headerRow.indexOf(valueField?.toLowerCase()) : valueColumn;
    const groupIndex = headerRow.indexOf(groupField?.toLowerCase()) > -1 ? headerRow.indexOf(groupField?.toLowerCase()) : groupColumn;
    const countUniqueIndex = headerRow.indexOf(countUniqueField?.toLowerCase()) > -1 ? headerRow.indexOf(countUniqueField?.toLowerCase()) : countUniqueColumn;
    const objectForCheckingUniqueCount = {};

    // console.log(mapping);
    // console.log('Row search', rowSearch);
    // console.log('Label Index', labelIndex)
    if (rowSearch && (labelIndex || labelIndex === 0)) {
      console.log('Searching for row', rowSearch);
      worksheet.forEach((row, i) => {
        row.forEach(cell => {



          if (`${cell}`.toLowerCase().search(rowSearch?.toLowerCase()) !== -1) {
            console.log('Found', cell, rowSearch)
            startRowIndex = i + (startRowOffset || 2);
          }
        })
        if (startRowIndex &&
          !endRowIndex &&
          row[labelIndex] === endSearch &&
          i > startRowIndex) {
          endRowIndex = i
        }
      });
    }

    if (rowCount && !endRowIndex) {
      endRowIndex = startRowIndex + rowCount
    };

    // console.log({
    //   startRowIndex,
    //   endRowIndex
    // })

    const slicedRows = startRowIndex && endRowIndex
      ? worksheet.slice(startRowIndex, endRowIndex)
      : startRowIndex && !endRowIndex
        ? worksheet.slice(startRowIndex)
        : worksheet.slice(1);

    // console.log('Sliced Row Length', slicedRows.length)

    const filterIndex = filter?.field && headerRow.indexOf(filter?.field?.toLowerCase()) > -1
      ? headerRow.indexOf(filter?.field?.toLowerCase())
      : filter?.column;

    const filterIndex2 = filter2?.field && headerRow.indexOf(filter2?.field?.toLowerCase()) > -1
      ? headerRow.indexOf(filter2?.field?.toLowerCase())
      : filter2?.column;

      // console.log({filterIndex, filterIndex2, filter, filter2});

    slicedRows
      .filter(row => (labelIndex || labelIndex === 0) ? !excludeKeys?.includes(row[labelIndex]?.trim()) : true)
      .filter(row => filter
        ? filter.value
          ? row[filterIndex]?.trim() === filter.value
          : filter.values
            ? filter.values.includes(row[filterIndex]?.trim())
            : true
        : true)
      .filter(row => filter2
        ? filter2.value
          ? `${row[filterIndex2]}`?.trim() === filter2.value
          : filter2.values
            ? filter2?.operation === 'exclude' 
              ? !filter2.values.includes(row[filterIndex2]?.trim())
              : filter2.values.includes(row[filterIndex2]?.trim())
            : true
        : true)
      .forEach(row => {
        if (!wholeTable){
        // console.log(row);
        const countUniqueValue = row[countUniqueIndex];

        const label = labelIndex || labelIndex === 0
          ? labelFormatter
            ? formatLabel({
              label: row[labelIndex]?.toString()?.trim(),
              labelFormatter
            })
            : `${row[labelIndex]?.toString()?.trim()}`
          : null;
        let value = valueIndex
          ? Number(row[valueIndex] || 0)
          : countRows && label
            ? !objectForCheckingUniqueCount?.[label]?.includes(`${countUniqueValue}`.toUpperCase().trim())
              ? 1 : 0
            : null;

        if (valueCalculator && !isNaN(parseInt(value))) {
          if (valueCalculator === 'inversePercentage')
            value = 1 - value
        }



        if (valueConverter === '0,00 => 0.00' && valueIndex && row?.[valueIndex]) {
          value = Number(row?.[valueIndex]?.split(',').join('.')) || null
        }

        if (
          replaceZeroWith && 
          (!value || row?.[valueIndex] === 0 || row?.[valueIndex] === '0' || !row?.[valueIndex] || row?.[valueIndex] === '0.00' || row?.[valueIndex] === '0,00' || row?.[valueIndex] === '0.0000' || row?.[valueIndex] === 'NA' || row?.[valueIndex] === 'NA\r' )
        ) {
          value = replaceZeroWith
        }

        if (valueFormatter && !isNaN(parseInt(value))) {
          if (valueFormatter === '%') {
            value = `${numeral(Number(value)).format('0.0')}%`
          } else {
            value = numeral(Number(value)).format(valueFormatter)
          }
        }



        if (quarter) {
          value = { [quarter]: value }
        }

        const convertGroup = string => {
          if (groupConverter === 'Trimestre => YYYY-QQ') {
            const [quarter, year] = string.split('Trimestre');
            return `${year.trim()}-Q${quarter.trim()}`;
          }

          return string
        };

        const group = groupValueSplitter
          ? row[groupIndex].split(groupValueSplitter)
          : row[groupIndex] !== ''
            ? convertGroup(row[groupIndex])
            : nullGroup || '';


        if (label && label !== '' && (labelIndex || labelIndex === 0) && (valueIndex || countRows)) {

          if (!result[indicator]) {
            result[indicator] = {}
          }
          if (!result[indicator][label]) {
            if ((groupIndex || groupIndex === 0) && group !== '' && !excludeGroups?.includes(group)) {
              result[indicator][label] = {};
              result[indicator][label][group] = value
            } else if (!(groupIndex || groupIndex === 0)) {
              result[indicator][label] = value
            }
          } else {
            if ((groupIndex || groupIndex === 0) && group !== '' && !excludeGroups?.includes(group)) {
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
            group.forEach(g => {
              if (!result[indicator][g]) {
                result[indicator][g] = value || 1
              } else {
                result[indicator][g] += value || 1
              }
            })
          }
          if (!groupValueSplitter && group !== '' && !excludeGroups?.includes(group)) {
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
            if (!result[indicator]) {
              result[indicator] = value || 0
            } else {
              result[indicator] += value || 0
            }
          }
        }
        } else {
          const tableArray = [];
          slicedRows.forEach(row => {
            const rowObj = {};
            headerRow.forEach((header, i) => {
              if (header !== labelIndex && header !== valueIndex) {
                rowObj[header] = row[i];
              }
            }
            );
            tableArray.push(rowObj);
          })
          result[indicator] = tableArray;

        }
    })
  });
  return result;
};

const flattenObject = (obj) => {
  const flattenedValues = {};
  let nestedKey = 'group'

  function recurse(current, property) {
    if (Object(current) !== current) {
      flattenedValues[property] = current;
    } else {
      for (const key in current) {
        nestedKey = key;
        recurse(current[key], property ? `${property}.${key}` : key);

      }
    }
  }

  recurse(obj, "");
  return { flattenedValues, nestedKey };
};

const calculatePercentageOnNestValues = (result, indicator, divisor) => {
  // Flatten the result[indicator] object
  const { flattenedValues, nestedKey } = flattenObject(result[indicator]);
  // Calculate the total from the flattened values
  // const nestKeys = Object.keys(flattenedValues);
  const total = Object.values(flattenedValues).reduce((a, b) => a + b, 0);

  // Calculate the sum of the values under the specified divisor
  const divisorTotal = Object.keys(flattenedValues)
    .filter(key => key.startsWith(divisor))
    .reduce((sum, key) => sum + flattenedValues[key], 0);

  // Calculate and update the percentage
  result[indicator] = { [nestedKey]: (divisorTotal / total) * 100 };
};

const runCalculations = ({ mappings, result }) => {
  mappings.forEach(mapping => {
    const {
      origin: {
        calculations
      },
      destination: {
        indicator
      } } = mapping;

    if (calculations) {
      calculations.forEach(({
        type,
        groups,
        divisor
      }) => {
        if (type === 'group') {
          const groupedObj = {};
          Object.entries(result[indicator]).forEach(([key, value]) =>
            Object.entries(groups).forEach(([groupKey, groupArray]) => {
              if (groupArray.includes(key)) {
                if (Object.keys(value)?.[0]) {
                  Object.entries(value).forEach(([valueKey, valueValue]) => {
                    if (!groupedObj[groupKey]) {
                      groupedObj[groupKey] = {};
                      if (!groupedObj[groupKey][valueKey])
                        groupedObj[groupKey][valueKey] = valueValue;
                    } else {
                      groupedObj[groupKey][valueKey] += valueValue
                    }
                  })
                }
                else {
                  if (!groupedObj[groupKey]) {
                    groupedObj[groupKey] = value
                  } else {
                    groupedObj[groupKey] += value
                  }
                }
              }
            })
          )
          result[indicator] = groupedObj;

          // console.log('Grouping Object', groupedObj)
        }
        if (type === 'percentOfTotal') {
          if (Object.values(Object.values(result[indicator])[0])[0]) {
            // console.log('Reducing nested values');
            calculatePercentageOnNestValues(result, indicator, divisor)

          } else {
            const total = Object.values(result[indicator]).reduce((a, b) => a + b, 0);
            result[indicator] = (result[indicator][divisor] / total) * 100;
          }
        }
        if (type === 'invertKeys') {
          const invertedObject = {};

          Object.entries(result[indicator]).forEach(([topKey, object]) => {
            Object.entries(object).forEach(([subKey, value]) => {
              if (!invertedObject[subKey]) {
                invertedObject[subKey] = {}
              }
              invertedObject[subKey][topKey] = value
            })
          })

          result[indicator] = invertedObject;
        }
        // console.log(indicator, type, result[indicator])

      })
    }
  })
  return result;
}

module.exports = {
  // parseXLSX,
  mapInNewData,
  getToken,
  fetchFromOneDrive,
  processData,
  runCalculations
}