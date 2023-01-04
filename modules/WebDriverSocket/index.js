const util = require('util');
const { Navigate, getAYReport } = require('./utils');
// const pdf = require('pdf-parse');
const pdfTableExtractor = require('@florpor/pdf-table-extractor') 


const WebDriverSocket = async ({url, source, project}) => {
  switch (source) {
    case 'Avison Young': {
      const {link} = await Navigate(url);
      await getAYReport({link, project})
  }
  }
};


module.exports = WebDriverSocket;