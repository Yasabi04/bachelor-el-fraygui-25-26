resource "aws_lambda_function" "state_observer" {
    filename         = "${path.module}/../lambda/observeState/observeState.zip"
    function_name    = "observe_state"
    role             = aws_iam_role.lambda_role.arn
    handler          = "observeState.handler"
    runtime          = "nodejs20.x"
    source_code_hash = filebase64sha256("${path.module}/../lambda/observeState/observeState.zip")

    environment {
        variables = {
            GLOBAL_STATE_TABLE = var.global_state_table_name
            SQS_QUEUE_URL = aws_sqs_queue.flight_data_queue.url
        }
        
    }
}