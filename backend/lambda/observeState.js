const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
    DynamoDBDocumentClient,
    UpdateCommand,
    GetCommand,
} = require("@aws-sdk/lib-dynamodb");
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const lambda = new LambdaClient({});

exports.handler = async (event) => {
    for (const record of event.Records) {

        console.log(record)
        // 1️⃣ Prüfen: was ist passiert?
        let delta = 0;
        if (record.eventName === "INSERT") delta = 1;
        if (record.eventName === "REMOVE") delta = -1;
        if (delta === 0) continue;

        // 2️⃣ Globalen Zustand atomar updaten
        const result = await dynamodb.send(
            new UpdateCommand({
                TableName: "GlobalState",
                Key: { pk: "FETCH_STATE" },

                UpdateExpression: `
          ADD activeConnections :delta
          SET isActive = activeConnections + :delta > :zero
        `,

                ExpressionAttributeValues: {
                    ":delta": delta,
                    ":zero": 0,
                },
                ReturnValues: "ALL_NEW",
            })
        );

        // 3️⃣ Wenn erste Connection kommt → fetchFlights starten
        if (delta === 1 && result.Attributes.activeConnections === 1) {
            console.log("Erste Connection → starte fetchFlights");
            await lambda.send(
                new InvokeCommand({
                    FunctionName: "fetchFlights",
                    InvocationType: "Event", // Asynchron
                })
            );
        }
    }
};
