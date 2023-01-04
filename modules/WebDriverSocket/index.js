const https = require('https');
const fs = require('fs');
const util = require('util');
const { AYQuarterlyReports } = require('./utils');
// const pdf = require('pdf-parse');
const pdfTableExtractor = require('@florpor/pdf-table-extractor') 


const WebDriverSocket = async ({url, source}) => {
  
  switch (source) {
    case 'Avison Young': {
      await AYQuarterlyReports(url).then(link => {
        const file = fs.createWriteStream("test.pdf");
        https.get(link, response => {
          response.pipe(file);
      
          // after download completed close filestream
          file.on("finish", () => {
            file.close();
      
            console.log("Download Completed");
            // let dataBuffer = fs.readFileSync('test.pdf');
      
            pdfTableExtractor('test.pdf').then(function (data) {
      
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
              console.log(util.inspect(data, false, null, true));
      
      
            });
          });
        });
      })
    }
  }

};

module.exports = { WebDriverSocket }