variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "chat-transcribe"
}

variable "db_password" {
  description = "RDS MySQL password"
  type        = string
  sensitive   = true
  default     = "ChatApp123!"
}
