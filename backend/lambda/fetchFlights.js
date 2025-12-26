const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
    DynamoDBDocumentClient,
    GetCommand,
} = require("@aws-sdk/lib-dynamodb");
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const lambda = new LambdaClient({});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

exports.handler = async (event) => {
    try {
        
        const response = await dynamodb.send(
            new GetCommand({
                TableName: "GlobalState",
                Key: { pk: "FETCH_STATE" },
            })
        );

        const isActive = response.Item?.isActive || false;
        const activeConnections = response.Item?.activeConnections || 0;

        console.log(`GlobalState: isActive=${isActive}, activeConnections=${activeConnections}`);

        // Wenn nicht aktiv → Polling stoppen
        if (!isActive) {
            console.log("Keine aktiven Verbindungen → Polling gestoppt");
            return { statusCode: 200, body: "Polling stopped" };
        }

        // 3️⃣ Flugdaten abrufen
        console.log("Fetching flights...");
        // TODO: Hier deine Flight-API-Logik einfügen
        // const flights = await fetchFromAPI();
        // await saveToDatabase(flights);
        // await broadcastToClients(flights);

        // 4️⃣ 10 Sekunden warten
        await wait(10000);

        // 5️⃣ Sich selbst erneut aufrufen (rekursiv)
        console.log("Starte nächsten Fetch-Zyklus...");
        await lambda.send(
            new InvokeCommand({
                FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
                InvocationType: "Event", // Asynchron
            })
        );

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Fetch cycle completed" }),
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
