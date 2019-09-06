import { performance } from 'perf_hooks';
import commander from "commander";

import { BlobServiceClient } from "@azure/storage-blob";

async function main(): Promise<void> {
  commander
    .option('-i, --iterations <iterations>', 'number of iterations', 10)
    .option('-n, --newClientPerIteration', 'create new client for every iteration', false);

  commander.parse(process.argv);

  const connectionString = process.env.STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw 'Env var STORAGE_CONNECTION_STRING must be set';
  }

  const containerName = "testContainer";
  const blobName = "testBlob";
  const testValue = "testValue";
  const testValueLength = Buffer.byteLength(testValue);

  let client = new BlobServiceClient(connectionString);
  let containerClient = client.getContainerClient(containerName);
  await containerClient.create();
  let blobClient = containerClient.getBlockBlobClient(blobName);

  for (let i = 0; i < commander.iterations; i++) {
    if (commander.newClientPerIteration) {
      client = new BlobServiceClient(connectionString);
      containerClient = client.getContainerClient(containerName);
      blobClient = containerClient.getBlockBlobClient(blobName);
    }

    const startMs = performance.now();
    await blobClient.upload(testValue, testValueLength);
    const result = await blobClient.download();
    const endMs = performance.now();

    const elapsedMs = endMs - startMs;
    var downloadedValue = await streamToString(result.readableStreamBody!);
    log(`${i} ${downloadedValue} ${Math.round(elapsedMs)}ms`);
  }
}

// A helper method used to read a Node.js readable stream into string
async function streamToString(readableStream: NodeJS.ReadableStream) {
  return new Promise((resolve, reject) => {
    const chunks: string[] = [];
    readableStream.on("data", (data) => {
      chunks.push(data.toString());
    });
    readableStream.on("end", () => {
      resolve(chunks.join(""));
    });
    readableStream.on("error", reject);
  });
}

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

main().catch(err => {
  console.log('Error occurred: ', err);
});
