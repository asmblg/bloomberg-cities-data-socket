const util = require('util');
const { 
  Navigate,
  parsePDFviaLink,
  parseTextFromImage,
  parseFromText,
  navigateDataAxelLogin,
  navigateDataAxelQuery
} = require('./utils');
// const pdf = require('pdf-parse');

const WebDriverSocket = async (config) => {


  switch (config.source) {
    // case 'Avison Young': {
    //   const {link} = await Navigate({
    //     baseURL: url,
    //     navigationArray: [{
    //       action: 'goto',
    //       url: baseURL,
    //       options: { timeout: 10000 }
    //     },
    //     {
    //       action: 'waitForSelector',
    //       selector: '.ay-pdf-link'
    //     },
    //     {
    //       action: 'getLinkFromButton',
    //       selector: '.ay-pdf-link',
    //       setResult: true
    //     } ]
    //   });
    //   await parsePDFviaLink({link, project, tablePage});
    //   await parseTextFromImage({
    //     imagePath : `./data/pdfparse/page-${tablePage}.png`
    //   })
    // }
    case 'JLL': {
      // const tablePage = 2;
      // const year = 2021;
      // const quarter = 'q4';
      // const city = 'tampa-bay';
      // const project = 'Tampa';
      // const rowSearch = 'Tampa CBD Totals';
      // const valueIndex = 7;

      const {
        tablePage,
        mapping: {
          year,
          quarter,
          subtype
        },
        city,
        project,
        rows,
        values,
        rowOffset,
        useText,
        pageRange
      } = config;

      await parsePDFviaLink({
        link: `https://www.us.jll.com/content/dam/jll-com/documents/pdf/research/americas/us/${quarter}-${year}-${subtype}-insights/jll-us-${subtype}-insight-${quarter}-${year}-${city}.pdf`.toLowerCase(), 
        project, 
        tablePage,
        pageRange

      }).catch(err => {throw err});

      if (useText) {
        const result = await parseFromText({
          textPath : `./data/pdfparse/${project}/text-${tablePage}.txt`,
          textPaths: pageRange
            ? pageRange.map(pageNum =>
              `./data/pdfparse/${project}/text-${pageNum}.txt`
              )
            : null,
          rows,
          values,
          rowOffset 

        }).catch(err => {throw err});

        return result;

      } else {
        const result = await parseTextFromImage({
          imagePath : `./data/pdfparse/${project}/page-${tablePage}.png`,
          rows,
          values,
          rowOffset 
        }).catch(err => {throw err});
  
        return result;      
      }


    }
    case 'Data Axel': {
      // const startDate = '10/01/2022';
      // const endDate = '12/31/2022';
      // const queryID = '1284969464';
      // const field = 'Total'  

      const {
        startDate,
        endDate,
        queries
      } = config;

      const navigationArray = [...navigateDataAxelLogin()];

      queries.forEach(({queryID,field}) =>
        navigateDataAxelQuery({
          startDate,
          endDate,
          queryID,
          field
        }).forEach(action => navigationArray.push(action))  
      );
    
      const result = await Navigate({
        navigationArray
      });

      return result;
    
    }
  }
};

module.exports = WebDriverSocket;