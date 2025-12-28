const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require("@aws-sdk/client-apigatewaymanagementapi");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const sqs = new SQSClient({ region: "eu-central-1" });
const dbClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dbClient);

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

        // WebSocket Endpoint konfigurieren
        const endpoint = event.requestContext 
            ? `https://${event.requestContext.domainName}/${event.requestContext.stage}`
            : process.env.WEBSOCKET_ENDPOINT;
        
        const apiGateway = new ApiGatewayManagementApiClient({ endpoint });

        // Alle verbundenen Clients abrufen
        const response = await dynamodb.send(
            new ScanCommand({
                TableName: "Connections",
            })
        );

        console.log(`Broadcasting to ${response.Items.length} connections`);

        // An alle Clients senden
        const sendPromises = response.Items.map(async (connection) => {
            try {
                await apiGateway.send(
                    new PostToConnectionCommand({
                        ConnectionId: connection.connectionId,
                        Data: JSON.stringify(message),
                    })
                );
                console.log(`Gesendet an: ${connection.connectionId}`);
            } catch (err) {
                if (err.statusCode === 410) {
                    console.log(`Tote connection ${connection.connectionId}`);
                } else {
                    console.error(`Fehler bei ${connection.connectionId}:`, err);
                }
            } 
        });

        await Promise.all(sendPromises);

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                message: "Broadcast erfolgreich",
                sentTo: response.Items.length 
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