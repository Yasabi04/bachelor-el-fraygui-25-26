resource "aws_sqs_queue" "flight_data_queue" {
  name                      = "flight-data-processing-queue"
  delay_seconds             = 0
  message_retention_seconds = 86400 # 1 Tag
  receive_wait_time_seconds = 10    # Long Polling
}

# Output für deine locals.json (SAM)
output "sqs_url" {
  value = aws_sqs_queue.flight_data_queue.id
}