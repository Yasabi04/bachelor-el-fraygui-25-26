resource "aws_lambda_event_source_mapping" "connections_stream" {
  event_source_arn  = aws_dynamodb_table.connections.stream_arn
  function_name     = aws_lambda_function.observeState.arn
  starting_position = "LATEST"
}