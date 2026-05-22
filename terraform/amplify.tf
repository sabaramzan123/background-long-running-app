resource "aws_amplify_app" "web" {
  count = var.amplify_repository == "" ? 0 : 1

  name         = "${local.name}-web"
  repository   = var.amplify_repository
  access_token = var.amplify_oauth_token
  platform     = "WEB_COMPUTE"
  # NOTE: iam_service_role_arn intentionally omitted. Amplify will create
  # and manage its own service-linked role for builds/deploys. Our custom
  # IAM role (aws_iam_role.amplify) is still used at runtime — attach it
  # in the Amplify console under "App settings" → "IAM roles" → "Compute
  # service role" after the first successful build.

  enable_branch_auto_build = true

  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*
  EOT

  # NOTE: Amplify forbids env vars starting with "AWS_" — it sets them itself
  # from the SSR runtime. The SDK still picks up AWS_REGION automatically.
  environment_variables = {
    S3_BUCKET      = aws_s3_bucket.images.bucket
    SQS_QUEUE_URL  = aws_sqs_queue.jobs.url
    DYNAMODB_TABLE = aws_dynamodb_table.jobs.name
  }

  tags = local.tags
}

resource "aws_amplify_branch" "main" {
  count       = var.amplify_repository == "" ? 0 : 1
  app_id      = aws_amplify_app.web[0].id
  branch_name = var.amplify_branch
  framework   = "Next.js - SSR"
  stage       = "PRODUCTION"
  enable_auto_build = true
  tags        = local.tags
}
