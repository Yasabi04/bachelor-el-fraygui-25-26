const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require("@aws-sdk/client-apigatewaymanagementapi");

const dbClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dbClient);

exports.handler = async (event) => {
    try {
        const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
        const apiGateway = new ApiGatewayManagementApiClient({ endpoint });

        // Message aus Event Body
        const body = JSON.parse(event.body || '{}');
        const message = body.message || { type: "broadcast", data: {} };

        console.log("Broadcasting message:", message);

        const response = await dynamodb.send(
            new ScanCommand({
                TableName: "Connections",
            })
        );

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
                    // Connection ist tot, sollte gelöscht werden
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