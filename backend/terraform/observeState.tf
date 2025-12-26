resource "aws_lambda_function" "state_observer" {
    filename         = "${path.module}/../lambda/observeState.zip"
    function_name    = "observe_state"
    role             = aws_iam_role.lambda_role.arn
    handler          = "observeState.handler"
    runtime          = "nodejs20.x"
    source_code_hash = filebase64sha256("${path.module}/../lambda/observeState.zip")
}