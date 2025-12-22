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

        //* eigentlich connections.allConnections.length !!!
        if (connections.allConnections.length >= 1) {
            console.log("Mindestens eine Verbindung! Setze POLLING_STATUS auf true");
            await this.db.setPollingStatus(true);
            
            // Prüfe ob Polling bereits läuft, bevor es gestartet wird
            if (!this.pollingHandler.isPolling) {
                console.log("Starte Polling-Cycle...");
                this.pollingHandler.executeFetch()
                    .catch(e => console.error('Polling Error', e))
            } else {
                console.log("Polling läuft bereits.");
            }
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