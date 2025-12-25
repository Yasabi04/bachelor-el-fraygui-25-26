const ConnectionManager = require('../shared/handlers/connectionManager')
const DynamoDBAdapter = require('../adapters/database/dynamodb')

const dbAdapter = new DynamoDBAdapter(
  process.env.POLLING_STATUS,
  process.env.CONNECTIONS_TABLE
)

const connectionManager = new ConnectionManager(dbAdapter)

export const handler = async () => {
  return await connectionManager.getActiveConnections()
};