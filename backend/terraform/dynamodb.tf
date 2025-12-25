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
}
