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
    console.log("Event received:", JSON.stringify(event, null, 2));

    // Prüfen ob Records existiert
    //
    if (!event.Records || !Array.isArray(event.Records)) {
        console.error("No Records found in event");
        return;
    }

    for (const record of event.Records) {
        console.log("Processing record:", record);

        let delta = 0;
        if (record.eventName === "INSERT") delta = 1;
        if (record.eventName === "REMOVE") delta = -1;
        if (delta === 0) continue;

        const result = await dynamodb.send(
            new UpdateCommand({
                TableName: "GlobalState",
                Key: { pk: "FETCH_STATE" },

                UpdateExpression: `
                    SET activeConnections = if_not_exists(activeConnections, :zero) + :delta
                `,

                ExpressionAttributeValues: {
                    ":delta": delta,
                    ":zero": 0,
                },
                ReturnValues: "ALL_NEW",
            })
        );

        let newConnectionCount = result.Attributes.activeConnections;

        // Edge Case: Falls activeConnections negativ wird, auf 0 setzen
        if (newConnectionCount < 0) {
            console.log(
                `activeConnections war negativ (${newConnectionCount}), setze auf 0`
            );
            const correctionResult = await dynamodb.send(
                new UpdateCommand({
                    TableName: "GlobalState",
                    Key: { pk: "FETCH_STATE" },
                    UpdateExpression: "SET activeConnections = :zero",
                    ExpressionAttributeValues: {
                        ":zero": 0,
                    },
                    ReturnValues: "ALL_NEW",
                })
            );
            newConnectionCount = correctionResult.Attributes.activeConnections;
        }

        console.log("Connection Count: ", newConnectionCount);
        const isActive = newConnectionCount > 0;

        // isActive separat aktualisieren
        await dynamodb.send(
            new UpdateCommand({
                TableName: "GlobalState",
                Key: { pk: "FETCH_STATE" },
                UpdateExpression: "SET isActive = :isActive",
                ExpressionAttributeValues: {
                    ":isActive": isActive,
                },
            })
        );

        console.log(
            `GlobalState updated: activeConnections=${newConnectionCount}, isActive=${isActive}`
        );

        // 3️⃣ Wenn erste Connection kommt → fetchFlights starten
        if (delta === 1 && newConnectionCount === 1) {
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
