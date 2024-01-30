require('dotenv').config();

const puppeteer = require('puppeteer');
const https = require('https');
const fs = require('fs');
const fsPromises = require('fs/promises')
// const util = require('util');
const PdfExtractor = require('pdf-extractor').PdfExtractor;
const Tesseract = require('tesseract.js');


const Navigate = async ({ navigationArray }) => {
  const browser = await puppeteer.launch({
    headless: true
  });
  const page = await browser.newPage();

  const result = {};

  let count = 0;
  let skipTo = null;


  for await ({
    action,
    url,
    options,
    selector,
    setResult,
    value,
    field,
    skip
  } of navigationArray) {
    try {
      count++
      if (skipTo < count) {
        switch (action) {
          case 'waitForNavigation':
            await page.waitForNavigation();
            break;
          case 'goto':
            await page.goto(url, options);
            break;
          case 'waitForSelector':
            await page.waitForSelector(selector);
            break;
          case 'waitForTimeout':
            await new Promise(r => setTimeout(r, value));
            break;
          case 'click':
            await page.click(selector);
            break;
          case 'select':
            await page.select(selector, value);
            break;
          case 'checkBox':
            await page.$eval(selector, el => el.checked = 'checked')
            break;
          case 'input':
            await page.type(selector, value)
            break;
          case 'inputUserName':
            await page.type(selector, process.env.DATA_AXEL_ACCOUNT_ID)
            break;
          case 'inputPassword':
            await page.type(selector, process.env.DATA_AXEL_PASSWORD)
            break;
          case 'getString':
            const n = await page.waitForSelector(selector)
            const text = await (await n.getProperty('textContent')).jsonValue()
            console.log(field, '==>', text)
            if (setResult) {
              result[field] = text.split(' ')[0].replace(/,/g, '');
            };
            break;
          case 'getLinkFromButton':
            const [link] = await page.evaluate(resultsSelector => {
              return [...document.querySelectorAll(resultsSelector)].map(anchor => {
                // const title = anchor.textContent.split('|')[0].trim();
                return anchor.href;
              });
            }, selector);
            if (setResult) {
              result.link = link;
            };
            break;
          default:
            break;
        }
      }
    } catch (err) {
      // console.error(err);
      console.log(`Error on item ${count} of navigation array.`);
      skipTo = count + skip;
    }
  };

  await browser.close();

  return result;
};

const navigateDataAxelLogin = () => [
  // LOGIN
  {
    action: 'goto',
    url: 'https://account.dataaxleusa.com/Authentication/SignInIndex',
    options: { timeout: 10000 }
  },
  {
    action: 'waitForSelector',
    selector: '#Password'
  },
  {
    action: 'waitForSelector',
    selector: '#AccountId'
  },
  {
    action: 'waitForSelector',
    selector: '#signin_button'
  },
  {
    action: 'input',
    selector: '#AccountId',
    value: process.env.DATA_AXEL_ACCOUNT_ID
  },
  {
    action: 'input',
    selector: '#Password',
    value: process.env.DATA_AXEL_PASSWORD
  },
  {
    action: 'click',
    selector: '#signin_button'
  },
  {
    action: 'waitForSelector',
    selector: '#button-build-a-business-list'
  }
];

const navigateDataAxelQuery = ({ queryID, startDate, endDate, field }) =>
  startDate && endDate 
  ? [
      {
        action: 'goto',
        url: `https://core.dataaxleusa.com/MyAccount/ReviewSavedList?orderId=${queryID}`,
        options: { timeout: 10000 },
        skip: 13
      },
      {
        action: 'waitForSelector',
        selector: '#ctl00_ctl00_MainContentPlaceHolder_youCurrentlyHave_imgBtnSeePrice',
        skip: 12
      },
      {
        action: 'click',
        selector: '#ctl00_ctl00_MainContentPlaceHolder_youCurrentlyHave_imgBtnSeePrice',
        skip: 11
      },
      {
        action: 'waitForSelector',
        selector: '#ctl00_ctl00_MainContentPlaceHolder_MainContentPlaceHolder_SubscriptionOptions1_btnOneTimeList',
        skip: 10
      },
      {
        action: 'goto',
        url: 'https://order.dataaxleusa.com/NewLeads/NewBusiness/SalesLeadsSelection.aspx?bas_vendor=190000&Page=ChoosePackage',
        skip: 9
      },
      {
        action: 'waitForSelector',
        selector: '#ctl00_ctl00_MainContentPlaceHolder_MainContentPlaceHolder_ucSalesLeadsSelection_tbDateFrom',
        skip: 8
      },
      {
        action: 'waitForSelector',
        selector: '#ctl00_ctl00_MainContentPlaceHolder_MainContentPlaceHolder_ucSalesLeadsSelection_tbDateTo',
        skip: 7
      },
      {
        action: 'click',
        selector: '#ctl00_ctl00_MainContentPlaceHolder_MainContentPlaceHolder_ucSalesLeadsSelection_rbStep1OptionB',
        skip: 6
      },
      {
        action: 'input',
        selector: '#ctl00_ctl00_MainContentPlaceHolder_MainContentPlaceHolder_ucSalesLeadsSelection_tbDateFrom',
        value: startDate,
        skip: 5
      },
      {
        action: 'input',
        selector: '#ctl00_ctl00_MainContentPlaceHolder_MainContentPlaceHolder_ucSalesLeadsSelection_tbDateTo',
        value: endDate,
        skip: 4
      },

      {
        action: 'click',
        selector: '#ctl00_ctl00_MainContentPlaceHolder_MainContentPlaceHolder_ucSalesLeadsSelection_btnRecalculate1',
        skip: 3
      },
      {
        action: 'waitForTimeout',
        value: 5000,
        skip: 2
      },
      {
        action: 'waitForSelector',
        selector: '#divYouCurrentlyHaveLeads b',
        skip: 1
      },
      {
        action: 'getString',
        selector: '#divYouCurrentlyHaveLeads b',
        field: field,
        setResult: true,
        skip: 0
      }
    ]
  : [
      {
        action: 'goto',
        url: `https://core.dataaxleusa.com/MyAccount/ReviewSavedList?orderId=${queryID}`,
        options: { timeout: 10000 },
        skip: 3
      },
      {
        action: 'waitForTimeout',
        value: 5000,
        skip: 2
      },
      {
        action: 'waitForSelector',
        selector: '#TheCount',
        skip: 1
      },
      {
        action: 'getString',
        selector: '#TheCount',
        field: field,
        setResult: true,
        skip: 0
      }
    ];

const parseFromText = async ({ textPaths, textPath, rows, values }) => {
  const result = {}
  let text = ''

  if (textPaths) {
    for await (path of textPaths) {
      const data = await fsPromises.readFile(path, 'utf-8')
      if (data) {
        text = `${text} ${data}`;
      };
    }
  } else {
    const data = await fsPromises.readFile(textPath, 'utf-8')
    if (data) {
      text = `${data}`;
    };
  }
  if (rows && values) {
    let consecutiveNumbers = 0;
    let money = false;
    let afterDecimal = false;
    let sigDigits = 0;

    const processedText = text.split('').map(char => {
      if (money && afterDecimal) {
        sigDigits++
        if (sigDigits === 2) {
          money = false;
          afterDecimal = false;
          sigDigits = 0;
          return `${char} `
        }
      }
      if (char === '$') {
        money = true
      }
      if (money && char === '.') {
        afterDecimal = true
      }
      if (!money && !isNaN(parseInt(char))) {
        consecutiveNumbers++;
      } else {
        consecutiveNumbers = 0;
      }

      if (char === '%') {
        return `${char} `;
      }
      if (consecutiveNumbers === 4 || char === '-') {
        consecutiveNumbers = 0;
        return ` ${char}`;
      }

      return char;

    }).join('').replace(/  +/g, ' ');

    rows.forEach(({ search: { start, end }, label, rowKey }, i) => {

      const startIndex = processedText.search(start);
      const endIndex = end ? processedText.search(end) : processedText.length - 1;
      const slice = processedText.slice(startIndex, endIndex);
      const rowKeyIndex = slice.search(rowKey)
      const subSlice = slice.slice(rowKeyIndex + rowKey.length)
      const dataArray = subSlice.trim().split(' ');

      if (dataArray) {
        result[label] = {};
        values.forEach(({ indicator, index }) => {
          result[label][indicator] = dataArray[index]
        })
      }
    });
  } else {
    result.text = text
  }



  return result;
};

const parseTextFromImage = async ({ imagePath, rows, values, rowOffset }) => {
  const results = {};
  await Tesseract.recognize(
    imagePath,
    'eng',
    // { logger: m => console.log(m) }
  ).then(({ data: { text } }) => {

    rows.forEach(({ search, label }) => {
      let rowIndex = rowOffset || 0;
      const textArray = text
        .split('\n');

      textArray.forEach((rowText, i) => {
        if (rowText.search(search) > -1) {
          rowIndex += i
        }
      })

      const row = textArray[rowIndex]
        .replace(search, '')
        .split(' ')

      results[label] = {};
      // results[label] = row;

      values.forEach(({ indicator, index }) => {
        results[label][indicator] = row[index]
      })
    })
    return rows;
  });
  return results;
};

const parsePDFviaLink = async ({ link, project, tablePage, pageRange }) =>
  new Promise((resolve, reject) => {
    console.log(link);
    const file = fs.createWriteStream(`./data/${project}-report.pdf`);
    https.get(link, response => {
      response.pipe(file);

      // after download completed close filestream
      file.on("finish", () => {
        file.close();
        const pdfExtractor = new PdfExtractor(`./data/pdfparse/${project}`, {
          viewportScale: (width, height) => {
            //dynamic zoom based on rendering a page to a fixed page size 
            if (width > height) {
              //landscape: 1100px wide
              return 1200 / width;
            }
            //portrait: 800px wide
            return 1200 / width;
          },
          // pageRange: pageRange 
          //   ? pageRange
          //   : [tablePage, tablePage],
        });

        pdfExtractor
          .parse(`./data/${project}-report.pdf`)
          .then(async () => {
            resolve()
          }).catch(function (err) {
            reject(err);
          });
      })
        .on('error', err =>
          reject(err)
        );
    })
  });

module.exports = {
  Navigate,
  parsePDFviaLink,
  parseTextFromImage,
  navigateDataAxelLogin,
  navigateDataAxelQuery,
  parseFromText
};