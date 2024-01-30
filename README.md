# Documentation for Data Socket Application

This document provides a comprehensive guide for creating and modifying configuration objects for the Data Socket application, which pulls data in various formats from an array of sources.

## Table of Contents
- [Introduction](#introduction)
- [Configuration Structure](#configuration-structure)
- [Configuration Parameters by Type](#configuration-parameters-by-type)
- [Creating a New Configuration](#creating-a-new-configuration)

## Introduction
The configuration objects are crucial for the Data Socket application to retrieve, process, and map data from the each source to the database collection serving the frontend dashboard. This guide will help you understand how to create and modify these configuration objects effectively.

## Configuration Structure
The configuration objects are structured in the JSON format, consisting of several key-value pairs, each serving a specific purpose in the data retrieval process.

## Scheduling a New Data Retrieval Event
1. Start with a template configuration object.
2. Fill in each key based on the required [configuation parmaters](#configuration-parameters-by-type) and your data retrieval needs.
3. Insert configuration object in the sockets collection on the database.

## Configuration Parameters by Type
Each configuration object contains parameters determining when a socket module will run, how it will get data and format it, and where it put the data in data collection serving the front dashboard.

### Global Parameters
All configuration objects will need these parameters with valid values.
- **scheduleDate**: Date and time for scheduled data retrieval in ISO 8601 format (`YYYY-MM-DDTHH:MM:SSZ`).
- **type**: Type of data socket (`BLS API`, `Census API`,`OneDrive`, `WebDriver`, `GoogleSheet`,  `SafeGraph`, or `SafeGraph Subareas`).

### (Almost) Global Parameters
- **project**: Name or identifier of the project (`phoenix`, `baltimore`, `tampa`).
- **description**: General description of the data being retrieved.
- **mapping**: Object defining how the retrieved data is inserted into the data collection serving the frontend dashboard.  This is used to configure: [Bureau of Labor Statistics (BLS) API Paremeters](#bureau-of-labor-statistics-bls-api-paremeters), [DataAxel WebDriver Parameters](#dataaxel-webdriver-parameters)
  - **geotype**: Geographical type of the data (e.g., `city`).
  - **geo**: key for specific geographic area (e.g., `atlanta`)
  - **year**: Key for year of data (e.g., `2024`).
  - **quarter**: Key for quarter of data. (e.g., `1` for Q1).
  - **category** : Key for high-level category (e.g., `realestate`).
  - **section**: Key for section of a category (e.g., `industrial`).
- **mappings**: Array of mapping objects to define how data in the file is extracted, processed and inserted into data collection serving the frontend dashboard.  This is used to configure: [XLSX File from OneDrive Parameters](#xlsx-file-from-onedrive-parameters) 
  - **destination**: Specifies the destination mapping for the data.
    - **geo**: Geographical identifier for the data destination.
    - **category**: Data category for the destination (e.g., `jobs`).
    - **year**: Relevant year for the data (e.g., `2022`).
    - **indicator**: Specific indicator for the data (e.g., `employment_by_industry`).
  - **origin**: Specifies the origin mapping for the data in the file.
    - **labelField**: Field name to be used as a label.
    - **labelFormatter**: Object specifying how to format the label.
      - **method**: Formatting method (e.g., `slice`).
      - **argument**: Arguments for the formatter method (e.g., `[0,2]`).
    - **valueField**: Field name representing the value to be used.
    - **groupField**: Field name to be used for grouping data.
    - **filter**: Criteria for filtering data.
      - **field**: Field name to apply the filter on.
      - **value**: Value to filter by (e.g., `Baltimore City County, MD`).

### Bureau of Labor Statistics (BLS) API Paremeters
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
- **mappings**: see [mappings](#almost-global-parameters) and unique paremeters below
  - **origin**
    - **valueIndex**: The variable key from the API response to map (e.g., `S1903_C03_001E` for median household income).

#### If mapping to a GeoJSON:
  ```json
  { "mapToGeo": true }
  ```
  - **geoType**: Value for finding the associated GeoJSON in the geos collection (e.g.`Zip Codes`)
  - **joinField**: Field for relating the incoming data with the appropriate feature in GeoJSON
  - **mappings**: see [mappings](#almost-global-parameters) and unique paremeters below
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
  - **queryID**: Unique identifier for the query created and saved on the [Data Axel platform](https://account.dataaxleusa.com/).  After a query is created and saved, the id will need to be extracted by inspecting the page at at https://core.dataaxleusa.com/savedlists.  If you're unfamiliar with the process inspecting elements in your browswer, here is a [How To](https://developer.chrome.com/docs/devtools/open).  The id can be found in the HTML for the *View Query* link at `orderId=XXXXXXXXXXX`:
   ```html
  <a href="/MyAccount/ReviewSavedList?orderId=1285433540">View Criteria</a>
  ```
  - **field**: Key for where the retrieved data will be stored (e.g., `total`).




