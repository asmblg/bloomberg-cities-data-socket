require('dotenv').config();
const { exec } = require('child_process');
const path = require("path");

// console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID);
// console.log("AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY);
// console.log("AWS_REGION:", process.env.AWS_REGION);
// console.log("AWS_BUCKET:", process.env.AWS_BUCKET);

const REGION = process.env.AWS_REGION;
const BUCKET_NAME = process.env.AWS_BUCKET;
const PREFIX = process.env.AWS_S3_PREFIX;
const DESTINATION = "./data/aws";

const  syncS3 = async () => {
  
  const command = `aws s3 sync s3://${BUCKET_NAME}/${PREFIX} ${DESTINATION} --region ${REGION}`;
  console.log(`Executing command: ${command}`);

  
  

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
}

module.exports = syncS3;