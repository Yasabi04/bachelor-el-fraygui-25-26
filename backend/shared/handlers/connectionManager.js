class ConnectionManager {
    constructor(dbAdapter, pollingHandler) {
        this.db = dbAdapter;
        this.pollingHandler = pollingHandler
    }

    async handleConnection(connectionId, userId) {
        console.log(`Speichern von ${userId} mit ${connectionId}`);


        await this.db.saveConnection(connectionId, userId);
 
        const connections = await this.db.getAllConnections();
        console.log('Verbunden: ', connections.allConnections.length)

        if (connections.allConnections >= 1) {
            console.log("Erste Verbindung! Setze POLLING_STATUS auf true");
            await this.db.setPollingStatus(true);
            this.pollingHandler.executeFetch()
                .catch(e => console.error('Polling Error', e))
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Verbunden!",
                connectionId,
            }),
        };
    }

    async handleDisconnection(connectionId) {
        console.log(`Entfernen von ${connectionId}`);

        await this.db.deleteConnection(connectionId);

        const connections = await this.db.getAllConnections();

        if (connections.length === 0) {
            console.log(
                "Keiner mehr verbunden. Setze POLLING_STATUS auf false"
            );
            await this.db.setPollingStatus(false);
        }

        return {
          statusCode: 200,
          body: JSON.stringify({
            message: 'Disconnected!'
          })
        }
    }
}

module.exports = ConnectionManager