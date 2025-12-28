resource "aws_sqs_queue" "flight_data_queue" {
  name                      = "flight-data-processing-queue"
  delay_seconds             = 0
  message_retention_seconds = 86400 # 1 Tag
  receive_wait_time_seconds = 10    # Long Polling
}

# Event Source Mapping: SQS triggert die Lambda
resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = aws_sqs_queue.flight_data_queue.arn
  function_name    = aws_lambda_function.fetch_flights.arn
  batch_size       = 1
  enabled          = true
}

# Output für deine locals.json (SAM)
output "sqs_url" {
  value = aws_sqs_queue.flight_data_queue.id
}