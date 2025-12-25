// $disconnect
const ConnectionManager = require("../shared/handlers/connectionManager");
const DynamoDBAdapter = require("../adapters/database/dynamodb");

const dbAdapter = new DynamoDBAdapter(
    process.env.POLLING_STATUS,
    process.env.CONNECTIONS_TABLE
);

const connectionManager = new ConnectionManager(dbAdapter);

exports.handler = async (event) => {
    const connectionId = event.requestContext.connectionId;
    return await connectionManager.removeConnection(connectionId);
};
