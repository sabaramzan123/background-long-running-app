import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import sharp from "sharp";

const region = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET;
const TABLE = process.env.DYNAMODB_TABLE;
const ARTIFICIAL_DELAY_MS = Number(process.env.ARTIFICIAL_DELAY_MS || "5000");

const s3 = new S3Client({ region });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

const SEPIA_MATRIX = [
  [0.393, 0.769, 0.189],
  [0.349, 0.686, 0.168],
  [0.272, 0.534, 0.131],
];

async function setStatus(jobId, status, extra = {}) {
  const names = { "#s": "status", "#u": "updatedAt" };
  const values = { ":s": status, ":u": Date.now() };
  let expr = "SET #s = :s, #u = :u";
  for (const [k, v] of Object.entries(extra)) {
    names[`#${k}`] = k;
    values[`:${k}`] = v;
    expr += `, #${k} = :${k}`;
  }
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { jobId },
      UpdateExpression: expr,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    })
  );
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function applyFilter(pipeline, filter) {
  switch (filter) {
    case "grayscale":
      return pipeline.grayscale();
    case "blur":
      return pipeline.blur(8);
    case "sepia":
      return pipeline.recomb(SEPIA_MATRIX);
    default:
      throw new Error(`unknown filter: ${filter}`);
  }
}

async function processOne({ jobId, inputKey, filter }) {
  console.log(`[${jobId}] start filter=${filter} key=${inputKey}`);
  await setStatus(jobId, "PROCESSING");

  if (ARTIFICIAL_DELAY_MS > 0) {
    await new Promise((r) => setTimeout(r, ARTIFICIAL_DELAY_MS));
  }

  const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: inputKey }));
  const inputBuf = await streamToBuffer(obj.Body);

  const outBuf = await applyFilter(sharp(inputBuf), filter).jpeg({ quality: 90 }).toBuffer();
  const outputKey = `processed/${jobId}.jpg`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: outputKey,
      Body: outBuf,
      ContentType: "image/jpeg",
    })
  );

  await setStatus(jobId, "DONE", { outputKey });
  console.log(`[${jobId}] done -> ${outputKey}`);
}

export const handler = async (event) => {
  const failures = [];
  for (const record of event.Records || []) {
    let payload;
    try {
      payload = JSON.parse(record.body);
      await processOne(payload);
    } catch (err) {
      console.error("processing failed", err);
      if (payload?.jobId) {
        try {
          await setStatus(payload.jobId, "FAILED", { error: String(err?.message || err) });
        } catch (e) {
          console.error("status update failed", e);
        }
      }
      failures.push({ itemIdentifier: record.messageId });
    }
  }
  return { batchItemFailures: failures };
};
