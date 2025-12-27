resource "aws_lambda_function" "fetch_flights" {
  function_name    = "fetchFlights"
  runtime          = var.lambda_runtime
  handler          = "fetchFlights.handler"
  filename         = "${path.module}/../lambda/fetchFlights.zip"
  source_code_hash = filebase64sha256("${path.module}/../lambda/fetchFlights.zip")
  role             = aws_iam_role.lambda_role.arn
  timeout          = 30

  environment {
    variables = {
      WEBSOCKET_ENDPOINT = "${replace(aws_apigatewayv2_stage.ws_stage.invoke_url, "wss://", "https://")}"
    }
  }
} 