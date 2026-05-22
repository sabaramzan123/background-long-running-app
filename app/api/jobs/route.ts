import { NextResponse } from "next/server";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";
import { sqs, ddb, QUEUE_URL, TABLE } from "@/lib/aws";
import type { Filter, Job } from "@/lib/types";

const FILTERS: Filter[] = ["grayscale", "blur", "sepia"];

export async function POST(req: Request) {
  const { inputKey, filter } = await req.json();
  if (!inputKey || !FILTERS.includes(filter)) {
    return NextResponse.json({ error: "inputKey and valid filter required" }, { status: 400 });
  }

  const now = Date.now();
  const job: Job = {
    jobId: uuid(),
    status: "QUEUED",
    filter,
    inputKey,
    createdAt: now,
    updatedAt: now,
  };

  await ddb.send(new PutCommand({ TableName: TABLE, Item: job }));
  await sqs.send(
    new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify({ jobId: job.jobId, inputKey, filter }),
    })
  );

  return NextResponse.json(job);
}
