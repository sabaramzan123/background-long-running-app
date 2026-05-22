# Build the Lambda zip on a Linux x64 container so sharp's native binaries
# match the Lambda runtime, AND zip inside the container (Windows can't read
# the symlink shims under node_modules/.bin via archive_file).
# Requires Docker Desktop running.
resource "null_resource" "build_lambda" {
  triggers = {
    index_hash   = filesha256("${path.module}/../lambda/processor/index.mjs")
    package_hash = filesha256("${path.module}/../lambda/processor/package.json")
  }

  provisioner "local-exec" {
    interpreter = ["PowerShell", "-Command"]
    command     = <<-EOT
      $ErrorActionPreference = "Stop"
      $src   = (Resolve-Path "${path.module}/../lambda/processor").Path
      $build = (Resolve-Path "${path.module}").Path + "\build"
      if (-not (Test-Path $build)) { New-Item -ItemType Directory -Path $build | Out-Null }

      Push-Location $src
      if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
      if (Test-Path processor.zip) { Remove-Item -Force processor.zip }
      docker run --rm -v "$($src):/var/task" public.ecr.aws/sam/build-nodejs20.x:latest bash -c "cd /var/task && npm install --omit=dev --platform=linux --arch=x64 --include=optional sharp && npm install --omit=dev && zip -qr processor.zip . -x '*.zip' 'README.md'"
      Pop-Location

      if ($LASTEXITCODE -ne 0) { throw "docker build failed (exit $LASTEXITCODE)" }
      Move-Item -Force (Join-Path $src "processor.zip") (Join-Path $build "processor.zip")
    EOT
  }
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${local.name}-processor-${local.suffix}"
  retention_in_days = 7
  tags              = local.tags
}

resource "aws_lambda_function" "processor" {
  function_name    = "${local.name}-processor-${local.suffix}"
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs20.x"
  handler          = "index.handler"
  filename         = "${path.module}/build/processor.zip"
  source_code_hash = null_resource.build_lambda.triggers.index_hash
  timeout          = 60
  memory_size      = 1024

  environment {
    variables = {
      S3_BUCKET           = aws_s3_bucket.images.bucket
      DYNAMODB_TABLE      = aws_dynamodb_table.jobs.name
      ARTIFICIAL_DELAY_MS = tostring(var.artificial_delay_ms)
    }
  }

  depends_on = [
    null_resource.build_lambda,
    aws_cloudwatch_log_group.lambda,
    aws_iam_role_policy.lambda_inline,
  ]

  tags = local.tags
}

resource "aws_lambda_event_source_mapping" "sqs" {
  event_source_arn                   = aws_sqs_queue.jobs.arn
  function_name                      = aws_lambda_function.processor.arn
  batch_size                         = 1
  function_response_types            = ["ReportBatchItemFailures"]
  maximum_batching_window_in_seconds = 0
}
