output "s3_bucket" {
  value       = aws_s3_bucket.images.bucket
  description = "Image bucket name."
}

output "sqs_queue_url" {
  value       = aws_sqs_queue.jobs.url
  description = "SQS queue URL the Next.js app posts to."
}

output "sqs_dlq_url" {
  value       = aws_sqs_queue.dlq.url
  description = "Dead-letter queue URL."
}

output "dynamodb_table" {
  value       = aws_dynamodb_table.jobs.name
  description = "DynamoDB jobs table name."
}

output "lambda_function" {
  value       = aws_lambda_function.processor.function_name
  description = "Processor Lambda function name."
}

output "amplify_app_id" {
  value       = try(aws_amplify_app.web[0].id, null)
  description = "Amplify app ID (null if amplify_repository was not set)."
}

output "amplify_default_domain" {
  value       = try(aws_amplify_app.web[0].default_domain, null)
  description = "Amplify default domain (deploy a branch in the console to get the live URL)."
}

output "env_local_block" {
  description = "Paste into .env.local for running Next.js locally."
  value       = <<-EOT
    AWS_REGION=${var.aws_region}
    S3_BUCKET=${aws_s3_bucket.images.bucket}
    SQS_QUEUE_URL=${aws_sqs_queue.jobs.url}
    DYNAMODB_TABLE=${aws_dynamodb_table.jobs.name}
  EOT
}
