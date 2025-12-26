provider "aws" {
  region = "eu-central-1"
}

resource "aws_dynamodb_table" "connections" {
  name           = "Connections"
  billing_mode   = "PAY_PER_REQUEST" # On-Demand
  hash_key       = "connectionId"

  attribute {
    name = "connectionId"
    type = "S"  # String
  }

  tags = {
    Environment = "dev"
    Project     = "aurora_th"
  }

  stream_enabled = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
}


resource "aws_dynamodb_table" "global_state" {
  name           = "GlobalState"
  billing_mode   = "PAY_PER_REQUEST" # On-Demand
  hash_key       = "pk"

  attribute {
    name = "pk"
    type = "S"  # String

  }

  tags = {
    Environment = "dev"
    Project     = "aurora_th"
  }
}