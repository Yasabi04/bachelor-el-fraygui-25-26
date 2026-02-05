const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
require('dotenv').config();

class PollingHandler {
    constructor(dbAdapter, wsAdapter) {
        this.db = dbAdapter;
        this.ws = wsAdapter;
        this.isPolling = false;
    }

    async executeFetch() {
        if (this.isPolling) {
            console.log("Polling läuft bereits. Starte keinen neuen Durchgang.");
            return;
        }

        this.isPolling = true;
        console.log("Polling-Schleife gestartet.");

        try {
            while (true) {
                // 1. Status prüfen
                var result = await this.db.getPollingStatus();
                const status = result.pollingStatus?.status ?? false;
                
                // 2. Wenn Status false ist, Schleife abbrechen
                if (status === false) {
                    console.log(`Status ist false. Polling wird beendet.`);
                    break; 
                }

                try {
                    console.log("Start fetch...");

                    // 3. Daten abrufen
                    const apiKey = process.env.AIRLABS_KEY;
                    const startTime = Date.now()
                    const req = await fetch(
                      `https://airlabs.co/api/v9/flights?status=en_route&bbox=34,-25,72,45&_fields=flight_iata,lat,lng,dir,speed,dep_iata,arr_iata,aircraft_icao,status&api_key=${apiKey}`
                    )
                    const response = await req.json();
                    let flights = response.response || [];

                    console.log(`Daten geladen: ${flights.length} Einträge.`);

                    const connResult = await this.db.getAllConnections();
                    const connections = connResult.allConnections || [];

                    if (connections.length > 0) {
                        await this.broadcastToConnections(connections, flights, startTime);
                    } else {
                        console.log("Keine aktiven Verbindungen gefunden. Polling wird beendet.");
                        break;
                    }

                    // 5. Warten
                    await sleep(10000);

                } catch (innerError) {
                    console.error("Fehler im Fetch-Vorgang:", innerError.message);
                    await sleep(10000);
                }
            }
        } catch (error) {
            console.error("Kritischer Fehler im Polling-Handler:", error);
        } finally {
            this.isPolling = false;
        }
    }

    async broadcastToConnections(connections, flights, timestamp) {
        try {
            const payload = JSON.stringify({ states: flights, timestamp,  type: "flight-update" })
            console.log('Timestamp:', timestamp)
            for (const conn of connections) {
                if (conn.connectionId) {
                    this.ws.postToConnection(conn.connectionId, payload);
                }
            }
        } catch (error) {
            console.error("Fehler beim Broadcast:", error.message);
        }
    }
}

module.exports = PollingHandler;