const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
    DynamoDBDocumentClient,
    ScanCommand,
    DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const {
    ApiGatewayManagementApiClient,
    PostToConnectionCommand,
} = require("@aws-sdk/client-apigatewaymanagementapi");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const sqs = new SQSClient({ region: "eu-central-1" });
const dbClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dbClient);

const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

exports.handler = async (event) => {
    try {
        let message;

        // Fall 1: Von fetchFlights Lambda aufgerufen
        if (event.type && event.data) {
            message = event;
            console.log("Broadcasting from Lambda:", message);
        } else {
            throw new Error("Invalid event format");
        }

        const actualTimeStamp = event.timestamp;
        const flights = event.data;

        // WebSocket Endpoint konfigurieren
        const endpoint = event.requestContext
            ? `https://${event.requestContext.domainName}/${event.requestContext.stage}`
            : process.env.WEBSOCKET_ENDPOINT;

        const apiGateway = new ApiGatewayManagementApiClient({ endpoint });

        const flightChunks = chunkArray(flights, 450);
        console.log(
            `${flights.length} Flüge auf ${flightChunks.length} aufgeteilt.`,
        );

        // Alle verbundenen Clients abrufen
        const response = await dynamodb.send(
            new ScanCommand({
                TableName: "Connections",
            }),
        );

        // Alte Verbindungen löschen
        const currentTime = Date.now();
        const deletePromises = response.Items
            .filter((connection) => currentTime - connection.timestamp > 20000)
            .map(async (connection) => {
                try {
                    await dynamodb.send(
                        new DeleteCommand({
                            TableName: "Connections",
                            Key: { connectionId: connection.connectionId },
                        }),
                    );
                    console.log(`Alte Verbindung gelöscht: ${connection.connectionId}`);
                } catch (error) {
                    console.error(`Fehler beim Löschen von ${connection.connectionId}:`, error);
                }
            });

        await Promise.all(deletePromises);

        console.log(`Broadcasting to ${response.Items.length} connections`);

        // An alle Clients senden
        const sendPromises = response.Items.flatMap((connection) => {
            return flightChunks.map(async (chunk, index) => {
                try {
                    await apiGateway.send(
                        new PostToConnectionCommand({
                            ConnectionId: connection.connectionId,
                            Data: JSON.stringify({
                                type: "flight-update-chunk",
                                totalChunks: flightChunks.length,
                                chunkIndex: index,
                                data: chunk,
                                timestamp: actualTimeStamp,
                            }),
                        }),
                    );
                    console.log(
                        `Chunk ${index + 1}/${flightChunks.length} gesendet an: ${connection.connectionId}`,
                    );
                } catch (err) {
                    if (err.statusCode === 410) {
                        console.log(
                            `Tote connection ${connection.connectionId}`,
                        );
                    } else {
                        console.error(
                            `Fehler bei ${connection.connectionId}:`,
                            err,
                        );
                    }
                }
            });
        });

        await Promise.all(sendPromises);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Broadcast erfolgreich",
                chunks: flightChunks.length,
                sentTo: response.Items.length,
            }),
        };
    } catch (error) {
        console.error("Broadcast Fehler:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
