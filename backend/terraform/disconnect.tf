resource "aws_lambda_function" "ws_disconnect" {
    function_name = "ws-disconnect"
    runtime       = "nodejs20.x"
    handler       = "disconnect.handler"
    filename      = "${path.module}/../lambda/disconnect/disconnect.zip"
    source_code_hash = filebase64sha256("${path.module}/../lambda/disconnect/disconnect.zip")
    role          = aws_iam_role.lambda_role.arn
}

resource "aws_lambda_permission" "ws_disconnect_permission" {
    statement_id  = "AllowAPIGatewayInvokeDisconnect"
    action        = "lambda:InvokeFunction"
    function_name = aws_lambda_function.ws_disconnect.function_name
    principal     = "apigateway.amazonaws.com"
    source_arn    = "${aws_apigatewayv2_api.ws_api.execution_arn}/*"
}

resource "aws_apigatewayv2_integration" "disconnect" {
    api_id           = aws_apigatewayv2_api.ws_api.id
    integration_type = "AWS_PROXY"
    integration_uri  = aws_lambda_function.ws_disconnect.invoke_arn
}

resource "aws_apigatewayv2_route" "disconnect" {
    api_id    = aws_apigatewayv2_api.ws_api.id
    route_key = "$disconnect"
    target    = "integrations/${aws_apigatewayv2_integration.disconnect.id}"
}