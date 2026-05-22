variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name prefix used for resource naming."
  type        = string
  default     = "image-processor"
}

variable "amplify_repository" {
  description = "Git repository URL for Amplify (e.g. https://github.com/USER/REPO). Leave empty to skip Amplify app creation."
  type        = string
  default     = ""
}

variable "amplify_branch" {
  description = "Branch Amplify should build."
  type        = string
  default     = "main"
}

variable "amplify_oauth_token" {
  description = "GitHub Personal Access Token for Amplify to clone the repo. Required if amplify_repository is set."
  type        = string
  default     = ""
  sensitive   = true
}

variable "artificial_delay_ms" {
  description = "Sleep inside the Lambda to dramatize 'long-running' for class demos."
  type        = number
  default     = 5000
}

variable "allowed_cors_origins" {
  description = "Allowed origins for direct browser uploads to S3."
  type        = list(string)
  default     = ["*"]
}
