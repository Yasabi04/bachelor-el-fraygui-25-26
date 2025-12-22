const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
require('dotenv').config();

class PollingHandler {
    constructor(dbAdapter, wsAdapter) {
        this.db = dbAdapter;
        this.ws = wsAdapter;
        // NEU: Flag um zu verhindern, dass der Loop mehrfach läuft
        this.isPolling = false;
    }

    async executeFetch() {
        // NEU: Wenn bereits gepollt wird, brechen wir hier ab.
        if (this.isPolling) {
            console.log("Polling läuft bereits. Starte keine neue Instanz.");
            return;
        }

        this.isPolling = true;
        console.log("Polling-Schleife gestartet.");

        try {
            // Endlosschleife
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
                    // const req = await fetch(
                    //     "http://www.randomnumberapi.com/api/v1.0/random?min=100&max=1000"
                    // );
                    const apiKey = process.env.AIRLABS_KEY;
                    const req = await fetch(
                      `https://airlabs.co/api/v9/flights?status=en_route&bbox=34,-25,72,45&_fields=flight_iata,lat,lng,dir,speed,dep_iata,arr_iata,aircraft_icao,status&api_key=${apiKey}`
                    )
                    const response = await req.json();
                    const flights = response.response || [];
                    // console.log('-----------------------------')
                    // console.log('API Response:', response)
                    // console.log('Flights Array:', flights)
                    // console.log('-----------------------------')

                    console.log(`Daten geladen: ${flights.length} Einträge.`);

                    // 4. Verbindungen holen und senden
                    // WICHTIG: Hier müssen wir das Array aus dem Objekt holen!
                    const connResult = await this.db.getAllConnections();
                    const connections = connResult.allConnections || [];

                    if (connections.length > 0) {
                        await this.broadcastToConnections(connections, flights);
                    } else {
                        // Sicherheitsnetz: Wenn keine Verbindungen da sind, aber Status noch true ist
                        console.log("Keine aktiven Verbindungen gefunden.");
                    }

                    // 5. Warten
                    console.log("Warte 10 Sekunden...");
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
            console.log("Polling-Schleife vollständig beendet.");
        }
    }

    async broadcastToConnections(connections, flights) {
        try {
            const payload = JSON.stringify({ states: flights })
            console.log(`Broadcasting to ${connections.length} connections`)
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