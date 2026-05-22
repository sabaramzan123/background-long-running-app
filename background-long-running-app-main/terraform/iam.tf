data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${local.name}-lambda-${local.suffix}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "lambda_inline" {
  statement {
    sid     = "S3RW"
    actions = ["s3:GetObject", "s3:PutObject"]
    resources = ["${aws_s3_bucket.images.arn}/*"]
  }
  statement {
    sid     = "SQSConsume"
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:ChangeMessageVisibility",
    ]
    resources = [aws_sqs_queue.jobs.arn]
  }
  statement {
    sid     = "DynamoWrite"
    actions = ["dynamodb:UpdateItem", "dynamodb:GetItem", "dynamodb:PutItem"]
    resources = [aws_dynamodb_table.jobs.arn]
  }
}

resource "aws_iam_role_policy" "lambda_inline" {
  name   = "${local.name}-lambda-inline"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda_inline.json
}

# ---- Amplify SSR role: lets the Next.js server hit S3/SQS/DynamoDB ----

data "aws_iam_policy_document" "amplify_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type = "Service"
      identifiers = [
        "amplify.amazonaws.com",
        "codebuild.amazonaws.com", # Amplify Gen 2 SSR builds use CodeBuild under the hood
      ]
    }
  }
}

resource "aws_iam_role" "amplify" {
  name               = "${local.name}-amplify-${local.suffix}"
  assume_role_policy = data.aws_iam_policy_document.amplify_assume.json
  tags               = local.tags
}

# Amplify needs broad permissions during build/deploy to create its own
# Lambda functions, CloudFront distributions, log groups, etc. This managed
# policy is purpose-built for that and is the AWS-recommended setup.
resource "aws_iam_role_policy_attachment" "amplify_managed" {
  role       = aws_iam_role.amplify.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess-Amplify"
}

data "aws_iam_policy_document" "amplify_inline" {
  statement {
    sid     = "S3PresignAndRW"
    actions = ["s3:GetObject", "s3:PutObject"]
    resources = ["${aws_s3_bucket.images.arn}/*"]
  }
  statement {
    sid       = "SQSProduce"
    actions   = ["sqs:SendMessage", "sqs:GetQueueAttributes"]
    resources = [aws_sqs_queue.jobs.arn]
  }
  statement {
    sid     = "DynamoRW"
    actions = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"]
    resources = [aws_dynamodb_table.jobs.arn]
  }
  statement {
    sid       = "AmplifyLogs"
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "amplify_inline" {
  name   = "${local.name}-amplify-inline"
  role   = aws_iam_role.amplify.id
  policy = data.aws_iam_policy_document.amplify_inline.json
}
