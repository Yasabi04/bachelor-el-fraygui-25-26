const awsUrl = "";
const serverUrl = `ws://localhost:7879?userId=${checkUser()}`;

// Global exportierte activePlanes Map
window.activePlanes = new Map();

const ws = new WebSocket(serverUrl);

function checkUser() {
    if (!localStorage.getItem("userId")) {
        const userId = crypto.randomUUID();
        localStorage.setItem("userId", userId);
        return userId;
    } else {
        return localStorage.getItem("userId");
    }
}

ws.onopen = () => {
    console.log("Verbunden!");
    ws.send("Client bereit");
};

ws.onmessage = (async (event) => {
    let rawData = event.data;

    if (rawData instanceof Blob) {
        rawData = await rawData.text();
    }

    try {
        const data = JSON.parse(rawData);

        const states = data.states || (Array.isArray(data) ? data : []);

        if (!Array.isArray(states)) return;

        states.forEach((flightArray) => {
            console.log(flightArray);

            const icao = flightArray[0];

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
                });
            }
        });

        // Custom Event auslösen, damit andere Dateien auf Updates reagieren können
        window.dispatchEvent(new CustomEvent('activePlanesUpdated', {
            detail: { activePlanes: window.activePlanes }
        }));
        
    } catch (e) {
        console.error("Fehler beim Verarbeiten der WebSocket-Daten:", e);
    }
});