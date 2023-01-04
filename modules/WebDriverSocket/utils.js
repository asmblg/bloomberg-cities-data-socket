const puppeteer = require('puppeteer');

const AYQuarterlyReports = async (baseURL) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(baseURL, { timeout: 10000 });
  // await page.screenshot({path: 'screenshot.png'});

  // Wait for suggest overlay to appear and click "show all results".
  const downloadButtonSelector = '.ay-pdf-link';
  await page.waitForSelector(downloadButtonSelector);

  // Extract the link from download button.
  const [link] = await page.evaluate(resultsSelector => {
    return [...document.querySelectorAll(resultsSelector)].map(anchor => {
      // const title = anchor.textContent.split('|')[0].trim();
      return anchor.href;
    });
  }, downloadButtonSelector);

  await browser.close();

  // Print all the files.
  return link;

};

module.exports = { AYQuarterlyReports }