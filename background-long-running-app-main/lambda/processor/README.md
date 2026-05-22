# Image Processor Lambda

SQS-triggered Node.js Lambda that:
1. Updates the DynamoDB job to `PROCESSING`.
2. Downloads the image from S3.
3. Applies the chosen filter via `sharp`.
4. Uploads the result to `processed/<jobId>.jpg`.
5. Marks the job `DONE` (or `FAILED`).

## Build

`sharp` ships native binaries. Build the deployment zip on **Linux x64** so the
right binaries are bundled (Amazon Linux 2 Lambda runtime). The Terraform
config (`terraform/lambda.tf`) does this for you via Docker.

If building manually:

```bash
cd lambda/processor
npm install --platform=linux --arch=x64 --include=optional sharp
zip -r ../build/processor.zip . -x "*.zip"
```

## Env vars (set by Terraform)

- `S3_BUCKET`
- `DYNAMODB_TABLE`
- `ARTIFICIAL_DELAY_MS` — defaults to 5000 to dramatize "long-running" in class demos.
