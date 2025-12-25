resource "aws_apigatewayv2_api" "ws_api" {
  name                       = "flights-ws-api"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action" # Relevant für Messages, nicht für connect/disconnect
}

/*
    aws_apigatewayv2_api = Art der AWS Ressource
    ws_api = interner Name für Terraform, existiert nicht in AWS. Hauptsächlich für Verweise -> Zeile 14
    name = Anzeiger Name in AWS
*/

resource "aws_apigatewayv2_stage" "ws_stage" {
  api_id      = aws_apigatewayv2_api.ws_api.id
  name        = "dev"
  auto_deploy = true
}

output "ws_url" {
  value = aws_apigatewayv2_stage.ws_stage.invoke_url
}