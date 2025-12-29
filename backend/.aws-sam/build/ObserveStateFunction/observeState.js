const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
    DynamoDBDocumentClient,
    UpdateCommand,
    ScanCommand,
} = require("@aws-sdk/lib-dynamodb");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const sqs = new SQSClient({});

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    console.log("Event received:", JSON.stringify(event, null, 2));

    if (!event.Records || !Array.isArray(event.Records)) {
        console.error("No Records found in event");
        return;
    }

    for (const record of event.Records) {
        const eventId = record.eventID;
        console.log("Processing record:", record);
        console.log("Event Name:", record.eventName);

        // Nur INSERT und REMOVE verarbeiten
        if (record.eventName !== "INSERT" && record.eventName !== "REMOVE") {
            console.log("→ Event ignored (not INSERT/REMOVE)");
            continue;
        }

        console.log(`→ ${record.eventName} detected, counting connections...`);

        // Echte Anzahl der Connections zählen
        const countResponse = await dynamodb.send(
            new ScanCommand({
                TableName: process.env.CONNECTIONS_TABLE || "Connections",
                Select: "COUNT",
            })
        );
        const newConnectionCount = countResponse.Count;

        console.log("Connection Count: ", newConnectionCount);
        const isActive = newConnectionCount > 0;

        // GlobalState mit absolutem Wert aktualisieren (mit Idempotenz)
        try {
            await dynamodb.send(
                new UpdateCommand({
                    TableName: process.env.GLOBAL_STATE_TABLE || "GlobalState",
                    Key: { pk: "FETCH_STATE" },
                    UpdateExpression:
                        "SET activeConnections = :count, isActive = :isActive, lastProcessedEventId = :eventId",
                    ConditionExpression:
                        "attribute_not_exists(lastProcessedEventId) OR lastProcessedEventId <> :eventId",
                    ExpressionAttributeValues: {
                        ":count": newConnectionCount,
                        ":isActive": isActive,
                        ":eventId": eventId,
                    },
                })
            );
        } catch (error) {
            if (error.name === "ConditionalCheckFailedException") {
                console.log(`Event ${eventId} already processed, skipping`);
                continue;
            }
            throw error;
        }

        console.log(
            `GlobalState updated: activeConnections=${newConnectionCount}, isActive=${isActive}`
        );

        // Nur beim ersten User SQS triggern
        if (newConnectionCount === 1 && record.eventName === "INSERT") {
            console.log("Erste Connection → Trigger SQS für Fetch-Zyklus");

            if (!process.env.AWS_SQS_URL) {
                console.warn("AWS_SQS_URL not set, skipping SQS trigger");
                continue;
            }

            try {
                console.log("Sende an SQS!");
                await sqs.send(
                    new SendMessageCommand({
                        QueueUrl: process.env.AWS_SQS_URL,
                        MessageBody: JSON.stringify({ action: "start_fetch" }),
                    })
                );
            } catch (sqsError) {
                console.error("SQS send failed:", sqsError);
                throw sqsError;
            }
        }
    }
};
