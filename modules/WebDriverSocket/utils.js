const puppeteer = require('puppeteer');
const https = require('https');
const fs = require('fs');
const util = require('util');


const Navigate = async (baseURL) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const result = {};

  const navigationArray = [
    {
      action: 'goto',
      url: baseURL,
      options: {timeout: 10000}
    },
    {
      action: 'waitForSelector',
      selector: '.ay-pdf-link'
    },
    { 
      action: 'getLinkFromButton',
      selector: '.ay-pdf-link',
      setResult: true
    }
  ];
  
  for await ({action, url, options, selector, setResult} of navigationArray) {
    switch (action) {
      case 'goto':
        await page.goto(url, options);
        break;
      case 'waitForSelector':
        await page.waitForSelector(selector);
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

const getAYReport = async ({link, project}) => 
 new Promise((resolve) => {
    const file = fs.createWriteStream(`./data/${project}-report.pdf`);
    https.get(link, response => {
        response.pipe(file);

        // after download completed close filestream
        file.on("finish",() => {
          file.close();

          console.log(project, "Download Completed");
          // let dataBuffer = fs.readFileSync(`./data/${project}-report.pdf`);
          pdfTableExtractor(`./data/${project}-report.pdf`).then(async data => {

            // // number of pages
            // console.log(data.numpages);
            // // number of rendered pages
            // console.log(data.numrender);
            // // PDF info
            // console.log(data.info);
            // // PDF metadata
            // console.log(data.metadata);
            // // PDF.js version
            // // check https://mozilla.github.io/pdf.js/getting_started/
            // console.log(data.version);
            // PDF text
            // const array = data.text.split('\n')
            // console.log(array.slice(array.indexOf('Office market activity')));
            // console.log(util.inspect(data, false, null, true));
            // resolve(console.log(`${project} ${data ? 'has data':'does not have data'}.`))
            resolve(console.log(util.inspect(data.pageTables[0].tables[0], false, null, true)))
            // res = data
          });
        })
        .on('error', err => console.log(err));
    })    
})

module.exports = { Navigate, getAYReport }