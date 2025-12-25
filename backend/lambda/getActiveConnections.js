const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
    DynamoDBDocumentClient,
    ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

export const handler = async (event) => {
    const client = new DynamoDBClient({});
    const dynamodb = DynamoDBDocumentClient.from(client);

    try {
        const req = await client.send(
            new ScanCommand({
                TableName: "Connections",
                Select: "COUNT",
            })
        );

        const count = req.Count;

        console.log(count);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "User deleted successfully",
                activeConnections: count,
            }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Active Connections:",
                activeConnections: count,
            }),
        };
    }
};
