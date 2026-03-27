require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { MongoClient } = require('mongodb');

async function findJsonFiles(dir, callback) {
    try {
        const files = await fs.readdir(dir, { withFileTypes: true });
        
        for (const file of files) {
            const fullPath = path.join(dir, file.name);

            if (file.isDirectory()) {
                await findJsonFiles(fullPath, callback); // Recursively look in this directory
            } else if (path.extname(file.name) === '.json') {
                await callback(fullPath); // Found a .json file
            }
        }
    } catch (err) {
        console.error('Error reading directory:', err);
    }
}

async function processJsonFile(filePath, collection, scheduleDate) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        const jsonData = JSON.parse(data).map(obj =>( {
          ...obj,
          scheduleDate: new Date(obj.scheduleDate || scheduleDate)
        }));
        // Insert into MongoDB collection
        await collection.insertMany(jsonData);
        console.log('JSON data inserted for file:', filePath);
    } catch (err) {
        console.error('Error processing JSON file:', err);
    }
}

async function main(rootFilePath, collectionName, scheduleDate) {
    const uri = process.env.MONGODB_URI; // Replace with your MongoDB connection string
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(process.env.DATABASE_NAME);
        const collection = db.collection(collectionName); // Replace with your collection name
        // Replace with your database name

        // Replace 'yourRootDirectoryPath' with your starting directory
        await findJsonFiles(rootFilePath, async (filePath) => {
            await processJsonFile(filePath, collection, scheduleDate);
        });
    } catch (err) {
        console.error('Database error:', err);
    } finally {
        await client.close();
    }
}

main(
  './configs/lisboa/quarterly', //FROM HERE
  'sockets', //TO HERE,
  '2026-01-15' //DEFAULT SCHEDULE DATE IF NOT SET BY CONFIG
);
