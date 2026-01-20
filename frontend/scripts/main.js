const awsUrl = `wss://i2axgim3s9.execute-api.eu-central-1.amazonaws.com/dev?userId=${checkUser()}`;
const serverUrl = `ws://localhost:7879?userId=${checkUser()}`;
const testUrl = 'ws://localhost:5879'
const wsIntervall = 60 * 1000 // Kickout für die Session
window.activePlanes = new Map();
const chunkBuffer = new Map(); // Chunk Verwaltung

const ws = new WebSocket(serverUrl);
const timeoutWindow = document.querySelector('.timeout-window')

function checkUser() {
    if (!localStorage.getItem("userId")) {
        const userId = crypto.randomUUID();
        localStorage.setItem("userId", userId);
        return userId;
    } else {
        return localStorage.getItem("userId");
    }
}

const timeout = setTimeout(() => {
    if(ws.readyState === WebSocket.OPEN){
        ws.close(1000, "TimeOut")
        timeoutWindow.style = `bottom: 0vh`;
    }
}, wsIntervall)

const processFlightData = (states) => {
    if (!Array.isArray(states)) return;

    states.forEach((flightArray) => {
        const icao = flightArray.flight_iata;

        if (window.activePlanes.has(icao)) {
            const existing = window.activePlanes.get(icao);
            window.activePlanes.set(icao, {
                ...existing,
                lat: flightArray.lat,
                long: flightArray.lng,
                deg: flightArray.dir,
                alt: flightArray.alt,
                spd: flightArray.speed
            });
        } else {
            window.activePlanes.set(icao, {
                aircraft_type: flightArray.aircraft_icao,
                lat: flightArray.lat,
                long: flightArray.lng,
                dep: flightArray.dep_iata,
                arr: flightArray.arr_iata,
                deg: flightArray.dir,
                alt: flightArray.alt,
                spd: flightArray.speed,
                isSelected: false
            });
        }
    });

    console.log(`${states.length} Flüge verarbeitet. Gesamt: ${window.activePlanes.size}`);

    // Custom Event auslösen
    window.dispatchEvent(new CustomEvent('activePlanesUpdated', {
        detail: { activePlanes: window.activePlanes }
    }));
};

ws.onopen = () => {
    console.log("Verbunden!");
};

ws.onmessage = (async (event) => {
    let rawData = event.data;

    if (rawData instanceof Blob) {
        rawData = await rawData.text();
    }

    try {
        const data = JSON.parse(rawData);

        if (data.type === "flight-update-chunk") {
            const { chunkIndex, totalChunks, data: chunkData } = data;
            
            console.log(`Chunk ${chunkIndex + 1}/${totalChunks} empfangen`);

            // Chunk speichern
            if (!chunkBuffer.has('current')) {
                chunkBuffer.set('current', {
                    chunks: new Array(totalChunks),
                    received: 0,
                    totalChunks: totalChunks
                });
            }

            const buffer = chunkBuffer.get('current');
            buffer.chunks[chunkIndex] = chunkData;
            buffer.received++;

            // Sind alle Chunks empfangen?
            if (buffer.received === totalChunks) {
                console.log(`Alle ${totalChunks} Chunks empfangen, verarbeite Daten...`);
                
                // Alle Chunks zusammenführen
                const allFlights = buffer.chunks.flat();
                console.log(`Gesamt ${allFlights.length} Flüge`);
                
                processFlightData(allFlights);
                
                // Buffer zurücksetzen
                chunkBuffer.delete('current');
            }
        } else {
            // Legacy: Alte Nachrichtenstruktur (ohne Chunks)
            const states = data.states || (Array.isArray(data) ? data : []);
            console.log("Timestamp:", data.timestamp);
            const now = Date.now()
            console.log(`Zeit: ${now-data.timestamp}`)
            processFlightData(states);
            // console.log("Flugdaten: ", data)
        }
        
    } catch (e) {
        console.error("Fehler beim Verarbeiten der WebSocket-Daten:", e);
    }
});

ws.onclose = () => {
    console.log("Verbindung geschlossen!");
}