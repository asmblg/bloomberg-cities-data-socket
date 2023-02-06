require('dotenv').config();

const puppeteer = require('puppeteer');
const https = require('https');
const fs = require('fs');
const util = require('util');
const PdfExtractor = require('pdf-extractor').PdfExtractor;
const Tesseract = require('tesseract.js');

// const pdfTableExtractor = require('@florpor/pdf-table-extractor') 

const Navigate = async ({navigationArray}) => {
  const browser = await puppeteer.launch({
    headless: true
  });
  const page = await browser.newPage();

  const result = {};

  for await ({ 
    action,
    url,
    options,
    selector,
    setResult,
    value 
  } of navigationArray) {
 
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
        await  page.$eval(selector, el => el.checked = 'checked')
        break;
      case 'input':
        await  page.type(selector, value)
        break;
      case 'inputUserName':
        await  page.type(selector, process.env.DATA_AXEL_ACCOUNT_ID)
        break;
      case 'inputPassword':
        await  page.type(selector, process.env.DATA_AXEL_PASSWORD)
        break;
      case 'getString':
        const n = await page.waitForSelector(selector);
        const text = await (await n.getProperty('textContent')).jsonValue()
        if (setResult) {
          result.text = text;
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
  };

  await browser.close();

  return result;
};

const parseTextFromImage = async ({imagePath, rowSearch, valueIndex}) => {
  const results = {};
  await Tesseract.recognize(
    imagePath,
    'eng',
    // { logger: m => console.log(m) }
  ).then(({ data: { text } }) => {
    const [row] = text
      .split('\n')
      .filter(row => row.search(rowSearch) > -1);

    console.log(text);
    console.log(row.split(' ')[valueIndex])
    
  })
  return results;
};

const parsePDFviaLink = async ({ link, project, tablePage }) =>
  new Promise((resolve) => {
    const file = fs.createWriteStream(`./data/${project}-report.pdf`);
    https.get(link, response => {
      response.pipe(file);

      // after download completed close filestream
      file.on("finish", () => {
        file.close();

        console.log(project, "Download Completed");


        const pdfExtractor = new PdfExtractor('./data/pdfparse/', {
            viewportScale: (width, height) => {
              //dynamic zoom based on rendering a page to a fixed page size 
              if (width > height) {
                //landscape: 1100px wide
                return 1100 / width;
              }
              //portrait: 800px wide
              return 800 / width;
            },
            pageRange: [tablePage, tablePage],
          });

       pdfExtractor.parse(`./data/${project}-report.pdf`).then(async () => {
          resolve(console.log('PDF Parse Complete.'))
        }).catch(function (err) {
          console.error('Error: ' + err);
        });
      })
      .on('error', err => console.log(err));
    })
});

module.exports = { Navigate, parsePDFviaLink, parseTextFromImage }