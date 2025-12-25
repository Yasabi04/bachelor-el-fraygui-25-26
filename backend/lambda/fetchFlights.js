const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda')
const PollingHandler = require('../shared/handlers/pollingHandler')
const DynamoDBAdapter = require('../adapters/database/dynamodb')

const lambdaClient = new LambdaClient({})

const dbAdapter = new DynamoDBAdapter(
    process.env.CONNECTIONS,
    process.env.POLLING_STATUS
)

const pollingHandler = new PollingHandler(dbAdapter)

exports.handler = async (event) => {
    console.log('fetchFlights erneut aufgerufen')

    const result = await pollingHandler.executeFetch(process.env.AIRLABS_API_KEY)

    if(result.stopped) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Polling gestoppt!',
                reason: result.reason
            })
        }
    }

    await lambdaClient.send(new InvokeCommand({
        FunctionName: process.env.AWS_FETCH_FUNCTION_NAME,
        InvocationType: 'Event',
        Payload: JSON.stringify({
            source: 'self-invoke',
            previousStats: result.stats
        })
    }))

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Fetch beendet. Nächste Runde startet in 10 Sekunden'
        })
    }
}