const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

exports.handler = async (event) => {
  const client = new DynamoDBClient({});
  const dynamodb = DynamoDBDocumentClient.from(client);

  const { connectionId } = event.requestContext;

  console.log(`Disconnecting conId ${connectionId}.`);

  try {
    await dynamodb.send(new DeleteCommand({
      TableName: 'Connections',
      Key: { connectionId }
    }));

    console.log(`Successfully deleted connection ${connectionId}`);
    return { statusCode: 200 };
  } catch (error) {
    console.error('Error deleting connection:', error);
    return { statusCode: 500 };
  }
};