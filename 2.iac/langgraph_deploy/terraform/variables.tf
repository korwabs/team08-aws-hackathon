variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "langgraph-prd"
}

variable "bedrock_model_id" {
  description = "Bedrock model ID for Claude"
  type        = string
  default     = "us.anthropic.claude-sonnet-4-20250514-v1:0"
}

variable "model_temperature" {
  description = "Model temperature setting"
  type        = string
  default     = "0"
}

variable "max_tokens" {
  description = "Maximum tokens for model response"
  type        = string
  default     = "4096"
}

variable "debug_mode" {
  description = "Debug mode setting"
  type        = string
  default     = "false"
}

variable "log_level" {
  description = "Logging level"
  type        = string
  default     = "INFO"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

variable "openai_api_key" {
  description = "OpenAI API Key"
  type        = string
  sensitive   = true
}

variable "nodejs_url" {
  description = "Node.js server URL"
  type        = string
  default     = ""
}
