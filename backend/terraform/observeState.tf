resource "aws_lambda_function" "state_observer" {
    filename         = "observerState.zip"
    function_name    = "observe_state"
    role             = aws_iam_role.lambda_exec.arn
    handler          = "index.handler"
    runtime          = "nodejs20.x"
    source_code_hash = filebase64sha256("${path.module}/../lambda/state_observer.zip")
}