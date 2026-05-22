import { NextResponse } from "next/server";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ddb, s3, BUCKET, TABLE } from "@/lib/aws";
import type { Job } from "@/lib/types";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await ddb.send(new GetCommand({ TableName: TABLE, Key: { jobId: id } }));
  if (!res.Item) return NextResponse.json({ error: "not found" }, { status: 404 });

  const job = res.Item as Job;
  const inputUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: job.inputKey }),
    { expiresIn: 600 }
  );
  let outputUrl: string | undefined;
  if (job.outputKey) {
    outputUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: BUCKET, Key: job.outputKey }),
      { expiresIn: 600 }
    );
  }

  return NextResponse.json({ ...job, inputUrl, outputUrl });
}
