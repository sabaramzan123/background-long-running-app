import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION || "us-east-1";

export const s3 = new S3Client({ region });
export const sqs = new SQSClient({ region });
export const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

export const BUCKET = process.env.S3_BUCKET!;
export const QUEUE_URL = process.env.SQS_QUEUE_URL!;
export const TABLE = process.env.DYNAMODB_TABLE || "image-processor-jobs";
