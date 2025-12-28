const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
    DynamoDBDocumentClient,
    GetCommand,
} = require("@aws-sdk/lib-dynamodb");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const dbClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dbClient);
const sqs = new SQSClient({});

exports.handler = async (event) => {
    try {
        // GlobalState checken
        const stateResponse = await dynamodb.send(
            new GetCommand({
                TableName: process.env.GLOBAL_STATE_TABLE || "GlobalState",
                Key: { pk: "FETCH_STATE" },
            })
        );

        const isActive = stateResponse.Item?.isActive || false;
        const activeConnections = stateResponse.Item?.activeConnections || 0;

        console.log(`GlobalState: isActive=${isActive}, activeConnections=${activeConnections}`);

        if (!isActive || activeConnections === 0) {
            console.log("Keine aktiven Connections → Fetch-Zyklus beendet");
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Fetch stopped - no active connections" })
            };
        }

        // Flights fetchen
        console.log("Fetching flights...");
        const flightResponse = await fetch(
            "http://www.randomnumberapi.com/api/v1.0/random?min=100&max=1000"
        );
        const flightData = await flightResponse.json();

        console.log("Flight Data:", flightData);

        // An Broadcast Lambda senden
        const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");
        const lambda = new LambdaClient({});

        await lambda.send(
            new InvokeCommand({
                FunctionName: process.env.BROADCAST_FUNCTION_NAME || "broadcast",
                InvocationType: "Event",
                Payload: JSON.stringify({
                    type: "flight-update",
                    data: flightData,
                }),
            })
        );

        console.log("Daten an Broadcast gesendet!");

        console.log("++++++++++++ Sende 10s! +++++++++++++")

        // Nächste Message in Queue senden für kontinuierliches Polling
        await sqs.send(
            new SendMessageCommand({
                QueueUrl: process.env.AWS_SQS_URL,
                MessageBody: JSON.stringify({ action: "start_fetch" }),
                DelaySeconds: 10  // 10 Sekunden
            })
        );

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Flugdaten gefetched und gebroadcasted" }),
        };
    } catch (error) {
        console.error("Error in fetchFlights:", error);
        throw error;
    }
};
