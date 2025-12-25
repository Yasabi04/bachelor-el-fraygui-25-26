# resource "aws_lambda_function" "lm_getConnections" {
#     function_name = "lm-getConnections"
#     runtime       = "nodejs20.x"
#     handler       = "getConnections.handler"
#     filename      = "${path.module}/../lambda/getConnections.zip"
#     source_code_hash = filebase64sha256("${path.module}/../lambda/getConnections.zip")
#     role          = aws_iam_role.lambda_role.arn
# }

# resource "aws_lambda_permission" "lm_getConnections_permission" {
#     statement_id  = "AllowAPIGatewayInvokeGetConnections"
#     action        = "lambda:InvokeFunction"
#     function_name = aws_lambda_function.lm_getConnections.function_name
#     principal     = "apigateway.amazonaws.com"
#     source_arn    = "${aws_apigatewayv2_api.ws_api.execution_arn}/*"
# }

# resource "aws_apigatewayv2_integration" "getConnections" {
#     api_id           = aws_apigatewayv2_api.ws_api.id
#     integration_type = "AWS_PROXY"
#     integration_uri  = aws_lambda_function.lm_getConnections.invoke_arn
# }

# resource "aws_apigatewayv2_route" "getConnections" {
#     api_id    = aws_apigatewayv2_api.ws_api.id
#     route_key = "getConnections"
#     target    = "integrations/${aws_apigatewayv2_integration.getConnections.id}"
# }