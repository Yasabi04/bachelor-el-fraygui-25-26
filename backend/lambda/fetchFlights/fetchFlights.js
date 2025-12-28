const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
    DynamoDBDocumentClient,
    GetCommand,
} = require("@aws-sdk/lib-dynamodb");
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

const dbClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dbClient);
const lambda = new LambdaClient({});

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
            console.log("Keine aktiven Verbindungen -> Polling gestoppt");
            return { statusCode: 200, body: "Polling stopped" };
        }

        console.log("Fetching flights...");
        const flightResponse = await fetch(
            "http://www.randomnumberapi.com/api/v1.0/random?min=100&max=1000"
        );
        const flightData = await flightResponse.json();
        console.log('--------------------------------');
        console.log("Flight data:", flightData);
        console.log('--------------------------------');

        console.log("Sending data to broadcast Lambda...");
        await lambda.send(
            new InvokeCommand({
                FunctionName: "broadcast",
                InvocationType: "Event", // Asynchron
                Payload: JSON.stringify({
                    type: "flight-update",
                    data: flightData
                }),
            })
        );

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                message: "Fetch completed"
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
