const awsUrl = `wss://eeupz64oh3.execute-api.eu-central-1.amazonaws.com/dev?userId=${checkUser()}`;
const serverUrl = `ws://localhost:7879?userId=${checkUser()}`;
const testUrl = 'ws://localhost:5879'
const wsIntervall = 10 * 1000 // Kickout für die Session
window.activePlanes = new Map();

const ws = new WebSocket(awsUrl);
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

        const states = data.states || (Array.isArray(data) ? data : []);

        if (!Array.isArray(states)) return;

        states.forEach((flightArray) => {
            // console.log(flightArray);

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
                });
            }
        });

        console.log(window.activePlanes)

        // Custom Event auslösen, damit andere Dateien auf Updates reagieren können
        window.dispatchEvent(new CustomEvent('activePlanesUpdated', {
            detail: { activePlanes: window.activePlanes }
        }));
        
    } catch (e) {
        console.error("Fehler beim Verarbeiten der WebSocket-Daten:", e);
    }
});

ws.onclose = () => {
    alert("Verbindung geschlossen!");
}