resource "random_id" "suffix" {
  byte_length = 3
}

locals {
  name   = var.project
  suffix = random_id.suffix.hex
  tags = {
    Project   = var.project
    ManagedBy = "terraform"
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
