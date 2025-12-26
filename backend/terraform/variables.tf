variable "aws_region" {
  description = "AWS Region für Deployment"
  type        = string
  default     = "eu-central-1"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Projektname für Tags"
  type        = string
  default     = "aurora_th"
}

variable "lambda_runtime" {
  description = "Node.js Runtime-Version"
  type        = string
  default     = "nodejs20.x"
}

variable "connections_table_name" {
  description = "Name der Connections-Tabelle"
  type        = string
  default     = "Connections"
}

variable "global_state_table_name" {
  description = "Name der GlobalState-Tabelle"
  type        = string
  default     = "GlobalState"
}

variable "lambda_role_name" {
  description = "Name der IAM Role für Lambda"
  type        = string
  default     = "lambda-websocket-role"
}
