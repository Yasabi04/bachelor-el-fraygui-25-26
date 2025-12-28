resource "aws_lambda_function" "broadcast" {
  function_name    = "broadcast"
  runtime          = var.lambda_runtime
  handler          = "broadcast.handler"
  filename         = "${path.module}/../lambda/broadcast/broadcast.zip"
  source_code_hash = filebase64sha256("${path.module}/../lambda/broadcast/broadcast.zip")
  role             = aws_iam_role.lambda_role.arn

  environment {
    variables = {
      WEBSOCKET_ENDPOINT = "${replace(aws_apigatewayv2_stage.ws_stage.invoke_url, "wss://", "https://")}"
    }
  }
}

resource "aws_lambda_permission" "broadcast_permission" {
  statement_id  = "AllowAPIGatewayInvokeBroadcast"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.broadcast.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ws_api.execution_arn}/*"
}

resource "aws_apigatewayv2_integration" "broadcast" {
  api_id           = aws_apigatewayv2_api.ws_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.broadcast.invoke_arn
}

resource "aws_apigatewayv2_route" "broadcast" {
  api_id    = aws_apigatewayv2_api.ws_api.id
  route_key = "broadcast"
  target    = "integrations/${aws_apigatewayv2_integration.broadcast.id}"
} 