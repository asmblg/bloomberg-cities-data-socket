# Documentation for Data Socket Application
This document provides a comprehensive guide for creating and modifying configuration objects for the Data Socket application which pulls data in various formats from an array of sources, processes it, and inserts it into a Mongo DB collection.

## Table of Contents
- [Introduction](#introduction)
- [Installation](#installation)
- [Running the Application Locally](#running-the-application)
- [Scheduling Data Retrieval Events](#scheduling-a-new-data-retrieval-event)
- [Configuration Structure](#configuration-structure)
- [Configuration Parameters by Type](#configuration-parameters-by-type)
  - [Global Parameters](#global-parameters)
  - [(Almost) Global Parameters](#almost-global-parameters)
  - [Bureau of Labor Statistics (BLS) API Parameters](#bureau-of-labor-statistics-bls-api-parmeters)
  - [US Census Bureau API Parameters](#us-census-bureau-api-parameters)
  - [XLSX File from OneDrive Parameters](#xlsx-file-from-onedrive-parameters)
  - [DataAxel WebDriver Parameters](#dataaxel-webdriver-parameters)

## Introduction
The configuration objects are crucial for the Data Socket application to retrieve, process, and map data from each source to the data collection on the database. This guide will help you understand how to create and modify these configuration objects effectively.

## Installation
Before you begin, ensure you have [Node.js](https://nodejs.org/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed on your system.

1. **Clone the repository:**
    ```bash
    $ git clone https://github.com/asmblg/bloomberg-cities-data-socket.git
    $ cd bloomberg-cities-data-socket
    ```
2. Install Dependencies
    ```bash
    $ npm install
    ```
3. Environment Variables
Create a `.env` file in the root of your installed application.  Populate the file with the following values.

    - MongoDB connection string. Replace `username`, `password`, and `clusterName` with your MongoDB credentials.
      ```
      MONGODB_URI=mongodb+srv://username:password@clusterName.mongodb.net/?retryWrites=true&w=majority
      ```

    - Name of the MongoDB database to which you are connecting
      ```
      DATABASE_NAME=YourDatabaseName
      ```

    - Microsoft User ID. Obtain from your Microsoft Azure or Office 365 account.
      ```
      MS_USER_ID=YourMicrosoftUserID
      ```

    - Microsoft Client ID. Obtain from your Microsoft Azure or Office 365 application settings.
      ```
      MS_CLIENT_ID=YourMicrosoftClientID
      ```

    - Microsoft Client Secret. Obtain from your Microsoft Azure or Office 365 application settings.
      ```
      MS_CLIENT_SECRET=YourMicrosoftClientSecret
      ```

    - API key for Bureau of Labor Statistics. Register at BLS Website to obtain the key.
      ```
      BLS_API_KEY=YourBureauOfLaborStatisticsAPIKey
      ```

    - Account ID and password for Data Axel. The ID is typically your registered email address.
      ```
      DATA_AXEL_ACCOUNT_ID=YourDataAxelUserName

      DATA_AXEL_PASSWORD=YourDataAxelPassword
      ```
    - API key for Safegraph data download. Obtain from your key by setting it up with the Dewey Marketplace platform.
      ```
      SAFEGRAPH_API_KEY=YourSafegraphAPIKey
      ```

    - Local or cloud database URI for storing large amounts of raw place and spending data.
      ```
      SAFEGRAPH_DB_URI=mongodb://127.0.0.1:27017
      ```

## Running the Application Locally 
```
$ npm start
```


## Scheduling Data Retrieval Events
1. Start with a template configuration object.
2. Fill in each key based on the required [configuation parmaters](#configuration-parameters-by-type) and your data retrieval needs.
3. Insert configuration object in the sockets collection on the database.

## Configuration Structure
The configuration objects are structured in the JSON format, consisting of several key-value pairs, each serving a specific purpose in the data retrieval process.

## Configuration Parameters by Type
Each configuration object contains parameters determining when a socket module will run, how it will get data and format it, and where it put the data in data collection serving the front dashboard.

### Global Parameters
All configuration objects will need these parameters with valid values.
- **type** (required): Type of data socket (`BLS API`, `Census API`,`OneDrive`, `WebDriver`, `GoogleSheet`,  `SafeGraph`, or `SafeGraph Subareas`).
- **scheduleDate** (required for automated deployment): Date and time for scheduled data retrieval in ISO 8601 format (`YYYY-MM-DDTHH:MM:SSZ`).


### (Almost) Global Parameters
- **project** (required in most casess): Name or identifier of the project (`phoenix`, `baltimore`, `tampa`).  This must consistent with project key for the database document where the retrieved data will be added.
- **description** (optional): General description of the data being retrieved.
- **mapping**: Object defining how the retrieved data is inserted into the data collection serving the frontend dashboard.  This is used to configure: [Bureau of Labor Statistics (BLS) API Parmeters](#bureau-of-labor-statistics-bls-api-parmeters), [DataAxel WebDriver Parameters](#dataaxel-webdriver-parameters).
  - **geotype**: Geographical type of the data (e.g., `city`).
  - **geo**: key for specific geographic area (e.g., `atlanta`)
  - **year**: Key for year of data (e.g., `2024`).
  - **quarter**: Key for quarter of data. (e.g., `1` for Q1).
  - **category** : Key for high-level category (e.g., `realestate`).
  - **section**: Key for section of a category (e.g., `industrial`).
- **mappings**: Array of mapping objects to define how data in the file is extracted, processed and inserted into data collection serving the frontend dashboard.  This is used to configure: [XLSX File from OneDrive Parameters](#xlsx-file-from-onedrive-parameters), [US Census Bureau API Parameters](#us-census-bureau-api-parameters). 
  - **destination**: Object which ppecifies the destination mapping for the data.
    - **category** (required): Key for high-level category (e.g., `jobs`).
    - **geotype**: Geographical type of the data (e.g., `city`).
    - **geo** (optional): key for specific geographic area (e.g., `atlanta`).
    - **year** (optional): Key for year of data (e.g., `2024`).
    - **quarter**: Key for quarter of data. (e.g., `Q1`).
    - **indicator** (optional): Specific indicator for the data (e.g., `employment_by_industry`).
  - **origin**: Object which opecifies the origin mapping for the data in the retrieved file.
    - **valueField** (required): Field name representing the value to be used.
    - **labelField** (optional): Field name to be used as a label.
    - **labelFormatter** (optional): Object specifying how to format the label.
      - **method**: Formatting method (e.g., `slice`).
      - **argument**: Arguments for the formatter method (e.g., `[0,2]`).
    - **groupField** (optional): Field name to be used for grouping data.
    - **filter** (optional): Criteria for filtering data.
      - **field**: Field name to apply the filter on.
      - **value**: Value to filter by (e.g., `Baltimore City County, MD`).

### Bureau of Labor Statistics (BLS) API Parameters
```json
{
  "type": "blsAPI"
}
```
- **url**: API endpoint URL.
- **source**: Data source (`BLS`).
- **frequency**: Frequency of data retrieval (e.g., `monthly`).
- **tables**: Array of objects for each data series.  Each object in the `tables` array should contain:
  - **seriesID**: Unique identifier for the data series from BLS.
  - **description**: Description of the data series.
  - **area**: Geographical area of the data.
  - **mapping**: see [mapping](#almost-global-parameters). 
  
### US Census Bureau API Parameters
```json
{
  "type": "CensusAPI"
}
```
- **url**: The API endpoint URL (e.g., `https://api.census.gov/data/2022/acs/acs1/subject`).
- **query**: The query parameters for the API call.
  - **get**: Comma-separated list of variables to retrieve (e.g., `NAME,S1903_C03_001E,...`).
  - **for**: Specifies the geographic filters for the query (e.g., `place:71000`).
  - **in**: Additional geographic scoping (e.g., `state:12`).
- **source**: Description of the data source (e.g., `ACS 1-year 2022`).
- **description**: General description of the data being retrieved (e.g., `Tampa City 2022 Subject Table Indicators`).
- **tableDescription**: Describes the type of table being accessed (e.g., `Subject Tables`).
- **mappings**: see [mappings](#almost-global-parameters) and additional parmeters below
  - **origin**
    - **valueIndex**: The variable key from the API response to map (e.g., `S1903_C03_001E` for median household income).

#### If mapping to a GeoJSON:
  ```json
  { "mapToGeo": true }
  ```
  - **geoType**: Value for finding the associated GeoJSON in the geos collection (e.g.`Zip Codes`)
  - **joinField**: Field for relating the incoming data with the appropriate feature in GeoJSON
  - **mappings**: see [mappings](#almost-global-parameters) and additional parmeters below
    - **origin**
      - **keyIndexes**: Array of keys for concatenating values from the data to join with GeoJSON features based on `joinField`  (e.g., `["state", "county", "tract"]`). 

### XLSX File from OneDrive Parameters
```json
{
  "type": "OneDrive",
  "fileType": "XLSX"
}
```
- **directoryID**: The identifier of the directory in OneDrive where the file is located.
- **fileName**: The name of the file to be retrieved.
- **sheetName**: Name of the sheet in the Excel file to be processed.
- **mappings**: see [mappings](#almost-global-parameters).

#### If mapping to a GeoJSON:
  ```json
  { "mapToGeo": true }
  ```
  - **geoType**: Value for finding the associated GeoJSON in the geos collection (e.g.`Zip Codes`)
  - **joinField**: Field for relating the incoming data with the appropriate feature in GeoJSON

### DataAxel WebDriver Parameters
```json
{
  "type": "WebDriver",
  "source": "DataAxel"
}
```
- **startDate**: Start date for the data retrieval query (formatted as `MM/DD/YYYY`).  If NOT included along with `endDate`, the total for ALL availalbe periods will be extracted.
- **endDate**: End date for the data retrieval query (formatted as `MM/DD/YYYY`). If NOT included along with `startDate`, the total for ALL availalbe periods will queried.
- **mapping**: see [mapping](#almost-global-parameters).
- **queries**: Array of query objects to be executed by the web driver.
  - **queryID**: Unique identifier for the query created and saved on the [Data Axel platform](https://account.dataaxleusa.com/).  After a query is created and saved, the id will need to be extracted by inspecting the page at at https://core.dataaxleusa.com/savedlists.  If you're unfamiliar with the process inspecting elements in your browswer, here is a [How To](https://developer.chrome.com/docs/devtools/open).  The id can be found in the HTML for the *View Query* link at `orderId=XXXXXXXXXX`:
    ```html
      <a href="/MyAccount/ReviewSavedList?orderId=XXXXXXXXXX">View Criteria</a>
    ```
  - **field**: Key for where the retrieved data will be stored (e.g., `total`).




## Contributors

Assemblage Consulting LLC

## License

This project is licensed under the MIT License - see the [LICENSE](https://opensource.org/license/mit) file for details.
