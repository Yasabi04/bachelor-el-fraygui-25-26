const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

exports.handler = async (event) => {
    const client = new DynamoDBClient({});
    const dynamodb = DynamoDBDocumentClient.from(client);
    const userId = event.queryStringParameters?.userId;
    const { connectionId } = event.requestContext;
    const currentTime = Date.now();

    console.log(`Connection ID: ${connectionId}. UserId: ${userId}. Zeitstempel: ${currentTime}`);

    

    try {
        await dynamodb.send(
            new PutCommand({
                TableName: "Connections",
                Item: { connectionId, userId, timestamp: currentTime },
            })
        );

        return { statusCode: 200 };
    } catch (error) {
        console.log(error);
        return { statusCode: 500 };
    }
};
