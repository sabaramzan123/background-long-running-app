resource "aws_sqs_queue" "dlq" {
  name                      = "${local.name}-dlq-${local.suffix}"
  message_retention_seconds = 1209600
  tags                      = local.tags
}

resource "aws_sqs_queue" "jobs" {
  name                       = "${local.name}-jobs-${local.suffix}"
  visibility_timeout_seconds = 120
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 10

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })

  tags = local.tags
}
