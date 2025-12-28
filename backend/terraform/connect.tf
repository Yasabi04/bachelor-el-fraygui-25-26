resource "aws_lambda_function" "ws_connect" {
  function_name = "ws-connect"
  runtime       = "nodejs20.x"
  handler       = "connect.handler"
  filename      = "${path.module}/../lambda/connect/connect.zip"
  source_code_hash = filebase64sha256("${path.module}/../lambda/connect/connect.zip")
  role          = aws_iam_role.lambda_role.arn
}

resource "aws_lambda_permission" "ws_connect_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ws_connect.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ws_api.execution_arn}/*"
}

resource "aws_apigatewayv2_integration" "connect" {
  api_id           = aws_apigatewayv2_api.ws_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.ws_connect.invoke_arn
}

resource "aws_apigatewayv2_route" "connect" {
  api_id    = aws_apigatewayv2_api.ws_api.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.connect.id}"
}