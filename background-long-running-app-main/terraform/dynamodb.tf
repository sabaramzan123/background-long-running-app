resource "aws_dynamodb_table" "jobs" {
  name         = "${local.name}-jobs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "jobId"

  attribute {
    name = "jobId"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = false
  }

  point_in_time_recovery {
    enabled = false
  }

  tags = local.tags
}
