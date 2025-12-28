const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

exports.handler = async (event) => {
    const client = new DynamoDBClient({});
    const dynamodb = DynamoDBDocumentClient.from(client);
    const userId = event.queryStringParameters?.userId;
    const { connectionId } = event.requestContext;

    console.log(`Connection ID: ${connectionId}. UserId: ${userId}`);

    

    try {
        await dynamodb.send(
            new PutCommand({
                TableName: "Connections",
                Item: { connectionId, userId },
                ConditionExpression: "attribute_not_exists(userId)",
            })
        );

        return { statusCode: 200 };
    } catch (error) {
        console.log(error);
        return { statusCode: 500 };
    }
};
