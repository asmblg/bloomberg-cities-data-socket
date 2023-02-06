// const {parsePDFviaLink} = require('./modules/WebDriverSocket/utils');
require('dotenv').config();
const {XLSXSocket, WebDriverSocket} = require('./modules');
const {Navigate, parsePDFviaLink, parseTextFromImage} = require('./modules/WebDriverSocket/utils');
const { getDbConnection } = require('./globalUtils/API');
const devConfig = require('./modules/XLSXSocket/devConfig.json')
const Tesseract = require('tesseract.js');

const runTest = async () => {

  // await WebDriverSocket({
  //   url: 'https://avisonyoung.us/web/phoenix/retail-market-report',
  //   project: 'Phoenix',
  //   source: 'Avison Young'
  // })

  const startDate = '01/01/2022';
  const endDate = '03/31/2022';
  const queryID = '1284969464';  
  // 1284970011 <= Phoenix
  // 1284969464 <= Tampa

  const {text} = await Navigate({
    navigationArray: [
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
        action: 'inputUserName',
        selector: '#AccountId'
      },
      {
        action: 'inputPassword',
        selector: '#Password'
      },
      {
        action: 'click',
        selector: '#signin_button'
      },
      {
        action: 'waitForSelector',
        selector: '#button-build-a-business-list'
      },
      {
        action: 'goto',
        url: `https://core.dataaxleusa.com/MyAccount/ReviewSavedList?orderId=${queryID}`,
        options: { timeout: 10000 }
      },
      {
        action: 'waitForSelector',
        selector: '#ctl00_ctl00_MainContentPlaceHolder_youCurrentlyHave_imgBtnSeePrice'
      },
      {
        action: 'click',
        selector: '#ctl00_ctl00_MainContentPlaceHolder_youCurrentlyHave_imgBtnSeePrice'
      },
      {
        action: 'waitForSelector',
        selector: '#ctl00_ctl00_MainContentPlaceHolder_MainContentPlaceHolder_SubscriptionOptions1_btnOneTimeList'
      },
      {
        action: 'goto',
        url: 'https://order.dataaxleusa.com/NewLeads/NewBusiness/SalesLeadsSelection.aspx?bas_vendor=190000&Page=ChoosePackage',
      },
      {
        action: 'waitForSelector',
        selector: '#ctl00_ctl00_MainContentPlaceHolder_MainContentPlaceHolder_ucSalesLeadsSelection_tbDateFrom'
      },
      {
        action: 'waitForSelector',
        selector: '#ctl00_ctl00_MainContentPlaceHolder_MainContentPlaceHolder_ucSalesLeadsSelection_tbDateTo'
      },
      {
        action: 'click',
        selector: '#ctl00_ctl00_MainContentPlaceHolder_MainContentPlaceHolder_ucSalesLeadsSelection_rbStep1OptionB'
      },
      {
        action: 'input',
        selector: '#ctl00_ctl00_MainContentPlaceHolder_MainContentPlaceHolder_ucSalesLeadsSelection_tbDateFrom',
        value: startDate
      },
      {
        action: 'input',
        selector: '#ctl00_ctl00_MainContentPlaceHolder_MainContentPlaceHolder_ucSalesLeadsSelection_tbDateTo',
        value: endDate
      },

      {
        action: 'click',
        selector: '#ctl00_ctl00_MainContentPlaceHolder_MainContentPlaceHolder_ucSalesLeadsSelection_btnRecalculate1'
      },
      {
        action: 'waitForTimeout',
        value: 5000
      },

      {
        action: 'waitForSelector',
        selector: '#divYouCurrentlyHaveLeads b'
      },
      {
        action: 'getString',
        selector: '#divYouCurrentlyHaveLeads b',
        setResult: true
      }
    ]
  });

  const result = text.split(' ')[0].replace(/,/g, '');

  console.log(result);


  // const tablePage = 2;
  // const year = 2021;
  // const quarter = 'q4';
  // const city = 'tampa-bay';
  // const project = 'Tampa';
  // const rowSearch = 'Tampa CBD Totals';
  // const valueIndex = 7;

  // await parsePDFviaLink({
  //   link: `https://www.us.jll.com/content/dam/jll-com/documents/pdf/research/americas/us/${quarter}-${year}-office-insights/jll-us-office-insight-${quarter}-${year}-${city}.pdf`, 
  //   project: project, 
  //   tablePage: tablePage
  // });

  // await parseTextFromImage({
  //   imagePath : `./data/pdfparse/page-${tablePage}.png`,
  //   rowSearch: rowSearch,
  //   valueIndex: valueIndex  
  // });


  // await Tesseract.recognize(
  //   './data/pdfparse/page-5.png',
  //   'eng',
  //   // { logger: m => console.log(m) }
  // ).then(({ data: { text } }) => {
  //   console.log(text);
  // })


  // if (process.env.MONGODB_URI) {

  //   const db = await getDbConnection(process.env.MONGODB_URI);
  //   // Get config array from DB
  //   // const dataSocketConfig = await getDataSocketConfig(db);

  //   for await (configObj of devConfig) {
  //     await XLSXSocket({
  //       ...configObj,
  //       clientID: process.env.MS_CLIENT_ID,
  //       clientSecret: process.env.MS_CLIENT_SECRET,
  //       db: db
  //     });
  //   }
  // }
};

runTest().then(() => process.exit(0))