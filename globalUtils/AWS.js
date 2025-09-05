import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { createWriteStream } from "fs";
import { pipeline } from "stream";
import { promisify } from "util";
import path from "path";

const pipelineAsync = promisify(pipeline);

const REGION = "us-east-1";
const BUCKET_NAME = "us-east-1-lightcast-bobsled-cloud"; // Extracted from the ARN
const PREFIX = "cfdbf960-e4dd-11ef-b6c9-ede8fea1cf62/latest/"; // Extracted from the S3 URI

const s3Client = new S3Client({ region: REGION });

async function listFiles() {
    try {
        const command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: PREFIX
        });

        const { Contents } = await s3Client.send(command);
        if (!Contents || Contents.length === 0) {
            console.log("No files found in the specified S3 path.");
            return [];
        }

        return Contents.map(item => item.Key);
    } catch (err) {
        console.error("Error listing files:", err);
        return [];
    }
}

async function downloadFile(key) {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });

        const { Body } = await s3Client.send(command);
        const filePath = path.join("./downloads", path.basename(key));

        console.log(`Downloading ${key} to ${filePath}...`);
        await pipelineAsync(Body, createWriteStream(filePath));
        console.log(`Downloaded: ${filePath}`);
    } catch (err) {
        console.error(`Error downloading ${key}:`, err);
    }
}

const getDataFromS3 = async () => {
    const files = await listFiles();
    if (files.length === 0) return;

    for (const file of files) {
        await downloadFile(file);
    }
}

module.exports = {
  getDataFromS3
}
