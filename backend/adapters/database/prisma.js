const prisma = require("../../shared/services/prismaClient");
require("dotenv").config();

class PrismDBAdapter {
    constructor(connectionsTable, pollingStatusTable) {
        this.connectionsTable = connectionsTable;
        this.pollingStatusTable = pollingStatusTable;
    }

    async saveConnection(connectionId, userId) {
        try {
            await prisma.connections.create({
                data: {
                    connectionId,
                    userId,
                },
            });
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

    async deleteConnection(connectionId) {
        console.log(connectionId)
        try {
            await prisma.connections.delete({
                where: {
                    connectionId: connectionId,
                },
            });
            return { 
                success: true,
            };
        } catch (error) {
            console.error("Fehler beim Entfernen der Verbindung", error);
            return {
                success: false,
                message: error.message,
            };
        }
    }

    async getAllConnections() {
        try {
            const allConnections = await prisma.connections.findMany();
            console.log('Gefundenen Connections: ', allConnections)
            return {
                success: true,
                allConnections: allConnections,
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
            const pollingStatus = await prisma.pollingStatus.findUnique({
                where: { status_id: "7111866" },
            });

            return {
                success: true,
                pollingStatus: pollingStatus,
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
                pollingStatus: false,
            };
        }
    }

    async setPollingStatus(status) {
        try {
            await prisma.pollingStatus.update({
                where: { status_id: "7111866" },
                data: { status: status },
            });
            return {
                success: true,
                message: `PRISMA: PollingStatus set to ${status}.`,
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }
}

module.exports = PrismDBAdapter;