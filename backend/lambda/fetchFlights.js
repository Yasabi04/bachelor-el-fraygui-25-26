const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
    DynamoDBDocumentClient,
    GetCommand,
    ScanCommand,
} = require("@aws-sdk/lib-dynamodb");
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require("@aws-sdk/client-apigatewaymanagementapi");

const dbClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dbClient);
const lambda = new LambdaClient({});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

exports.handler = async (event) => {
    try {
        const stateResponse = await dynamodb.send(
            new GetCommand({
                TableName: "GlobalState",
                Key: { pk: "FETCH_STATE" },
            })
        );

        const isActive = stateResponse.Item?.isActive || false;
        const activeConnections = stateResponse.Item?.activeConnections || 0;

        console.log(`GlobalState: isActive=${isActive}, activeConnections=${activeConnections}`);

        if (!isActive) {
            console.log("Keine aktiven Verbindungen → Polling gestoppt");
            return { statusCode: 200, body: "Polling stopped" };
        }

        console.log("Fetching flights...");

        const flightResponse = await fetch(
            "http://www.randomnumberapi.com/api/v1.0/random?min=100&max=1000"
        );
        const flightData = await flightResponse.json();
        console.log("Flight data:", flightData);

        const connectionsResponse = await dynamodb.send(
            new ScanCommand({
                TableName: "Connections",
            })
        );

        const apiGateway = new ApiGatewayManagementApiClient({
            endpoint: process.env.WEBSOCKET_ENDPOINT,
        });

        const broadcastPromises = connectionsResponse.Items.map(async (connection) => {
            try {
                await apiGateway.send(
                    new PostToConnectionCommand({
                        ConnectionId: connection.connectionId,
                        Data: JSON.stringify({ type: "flight-update", data: flightData }),
                    })
                );
                console.log(`Sent to ${connection.connectionId}`);
            } catch (err) {
                if (err.statusCode === 410) {
                    console.log(`Stale connection ${connection.connectionId}, removing...`);
                    // TODO: Connection aus DB löschen
                } else {
                    console.error(`Error sending to ${connection.connectionId}:`, err);
                }
            }
        });

        await Promise.all(broadcastPromises);
        await wait(10000);
        console.log("Starte nächsten Fetch-Zyklus...");

        await lambda.send(
            new InvokeCommand({
                FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
                InvocationType: "Event",
            })
        );

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                message: "Fetch cycle completed",
                sentTo: connectionsResponse.Items.length 
            }),
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
