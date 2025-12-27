const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
    DynamoDBDocumentClient,
    GetCommand,
} = require("@aws-sdk/lib-dynamodb");
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

const dbClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dbClient);
const lambda = new LambdaClient({});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

exports.handler = async (event) => {
    try {
        // 1️⃣ GlobalState prüfen
        const stateResponse = await dynamodb.send(
            new GetCommand({
                TableName: "GlobalState",
                Key: { pk: "FETCH_STATE" },
            })
        );

        const isActive = stateResponse.Item?.isActive || false;
        const activeConnections = stateResponse.Item?.activeConnections || 0;

        console.log(`GlobalState: isActive=${isActive}, activeConnections=${activeConnections}`);

        // 2️⃣ Wenn nicht aktiv → Polling stoppen
        if (!isActive) {
            console.log("Keine aktiven Verbindungen → Polling gestoppt");
            return { statusCode: 200, body: "Polling stopped" };
        }

        // 3️⃣ Flugdaten abrufen
        console.log("Fetching flights...");
        const flightResponse = await fetch(
            "http://www.randomnumberapi.com/api/v1.0/random?min=100&max=1000"
        );
        const flightData = await flightResponse.json();
        console.log('--------------------------------');
        console.log("Flight data:", flightData);
        console.log('--------------------------------');

        // 4️⃣ Daten an broadcast Lambda weiterleiten
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

        // 5️⃣ 10 Sekunden warten
        await wait(10000);

        // 6️⃣ Sich selbst erneut aufrufen
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
                message: "Fetch cycle completed"
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
