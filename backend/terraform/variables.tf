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

variable "sqs_queue_name" {
  description = "Name der SQS Queue für Flight Data Processing"
  type        = string
  default     = "flight-data-processing-queue"
}

variable "lambda_timeout" {
  description = "Timeout für Lambda Funktionen in Sekunden"
  type        = number
  default     = 10
}

variable "lambda_memory_size" {
  description = "Memory Size für Lambda Funktionen in MB"
  type        = number
  default     = 128
}

variable "websocket_api_name" {
  description = "Name der WebSocket API"
  type        = string
  default     = "flight-tracker-websocket"
}

variable "websocket_stage_name" {
  description = "Stage Name für WebSocket API"
  type        = string
  default     = "dev"
}

variable "lambda_zip_path" {
  description = "Pfad zu den Lambda ZIP-Dateien"
  type        = string
  default     = "../lambda"
}

variable "sqs_visibility_timeout" {
  description = "SQS Visibility Timeout in Sekunden"
  type        = number
  default     = 30
}

variable "sqs_message_retention" {
  description = "SQS Message Retention in Sekunden (4 Tage)"
  type        = number
  default     = 345600
}