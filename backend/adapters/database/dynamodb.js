const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
    ScanCommand,
    DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");

class DynamoDBAdapter {
    constructor(connectionsTable, pollingStatusTable) {
        const client = new DynamoDBClient({});
        this.docClient = DynamoDBDocumentClient.from(client);
        this.connectionsTable = connectionsTable;
        this.pollingStatusTable = pollingStatusTable;
    }

    async saveConnection(connectionId, userId) {
        try {
            await this.docClient.send(
                new PutCommand({
                    TableName: this.connectionsTable,
                    Item: {
                        connectionId,
                        userId,
                    },
                })
            );

            return {
                success: true,
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    async getAllConnections() {
        try {
            await this.docClient.send(
                new ScanCommand({
                    TableName: this.connectionsTable,
                })
            );
            return {
                success: true,
                result: results.Item || [],
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    async deleteConnection(connectionId) {
        try {
            await this.docClient.send(
                new DeleteCommand({
                    TableName: this.connectionsTable,
                    Key: { connectionId },
                })
            );

            return {
                success: true,
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    async getPollingStatus() {
        try {
            await this.docClient.send(
                new GetCommand({
                    TableName: this.pollingStatusTable,
                    Key: { id: "status_id" },
                })
            );

            return {
                success: true,
                pollingStatus: result.Item?.status || false,
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    async setPollingStatus(status) {
        try {
            await this.docClient.send(
                new PutCommand({
                    TableName: this.pollingStatusTable,
                    Item: {
                        id: "polling_status",
                        status: status,
                    },
                })
            );
            return {
                success: true,
                message: `DYNAMODB: Polling Status set to ${status}`
            }
        } catch (error) {
            return {
                success: true,
                messge: error.message
            };
        }
    }
}

module.exports = DynamoDBAdapter;
