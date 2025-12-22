let map = null;
let activeRoutes = new Map(); // Speichert aktive Routen für Toggle
let planeMarkers = new Map(); // Speichert die Marker für jedes Flugzeug
let isUpdating = false; // Verhindert gleichzeitige Updates
let updateScheduled = false; // Für Throttling

// Verwende die globale activePlanes Map aus main.js
// Fallback für Entwicklung/Test, falls main.js noch nicht geladen ist
if (!window.activePlanes) {
    window.activePlanes = new Map();

    window.activePlanes.set("LH810", {
        aircraft_type: "AIRBUS A320 - 200",
        lat: 51.43,
        long: 3.21,
        dep: "FRA",
        arr: "JFK",
    });

    window.activePlanes.set("CA7289", {
        aircraft_type: "Boeing 777-200",
        lat: 52.15,
        long: -35.2,
        dep: "YVR",
        arr: "FCO",
    });

    window.activePlanes.set("RYR5880", {
        aircraft_type: "Boeing 737-8",
        lat: 50.43,
        long: 3.21,
        dep: "CGN",
        arr: "STN",
    });

    window.activePlanes.set("BA456", {
        aircraft_type: "AIRBUS A380",
        lat: 48.85,
        long: 2.35,
        dep: "LHR",
        arr: "SIN",
    });

    window.activePlanes.set("AF1234", {
        aircraft_type: "Boeing 777-300",
        lat: 52.52,
        long: 13.4,
        dep: "CDG",
        arr: "LAX",
    });

    window.activePlanes.set("EK789", {
        aircraft_type: "AIRBUS A330-900",
        lat: 45.76,
        long: 4.84,
        dep: "DXB",
        arr: "MUC",
    });

    window.activePlanes.set("UA9021", {
        aircraft_type: "Boeing 787-9 Dreamliner",
        lat: 53.55,
        long: 9.99,
        dep: "EWR",
        arr: "FRA",
    });

    window.activePlanes.set("QR456", {
        aircraft_type: "AIRBUS A321neo",
        lat: 50.03,
        long: 8.57,
        dep: "DOH",
        arr: "BCN",
    });
}

//* Dummy Daten
// window.activePlanes.set("LH810", {
//     aircraft_type: "AIRBUS A320 - 200",
//     lat: 51.43,
//     long: 3.21,
//     dep: "FRA",
//     arr: "JFK",
// });

// window.activePlanes.set("CA7289", {
//     aircraft_type: "Boeing 777-200",
//     lat: 52.15,
//     long: -35.2,
//     dep: "YVR",
//     arr: "FCO",
// });

// Event Listener für automatische Updates von main.js mit Throttling
window.addEventListener("activePlanesUpdated", (event) => {
    // Throttle updates auf max 1x pro Sekunde
    if (updateScheduled) return;
    
    updateScheduled = true;
    setTimeout(() => {
        updatePlaneMarkers();
        updateScheduled = false;
    }, 1000);
});

const tileLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        maxZoom: 19,
    }
);

const canvasRenderer = L.canvas({ 
    padding: 0.5,
    tolerance: 5,
    updateWhenIdle: false,
    updateWhenZooming: false
});
const coordsControl = L.control({ position: "bottomleft" });
coordsControl.onAdd = () => {
    const div = L.DomUtil.create("div", "coords");
    div.style.padding = "0.4rem";
    div.style.background = "rgba(183, 213, 248, 0.74)";
    div.style.fontFamily = "monospace";
    div.innerHTML = "Lat: -, Lng: -";
    return div;
};

const planeIcon2 = L.icon({
    iconUrl: "./img/flg-zweistrahlig.svg",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

const planeIcon4 = L.icon({
    iconUrl: "./img/flg-vierstrahlig.svg",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
});

// Hilfsfunktion zum Erstellen eines rotierten Icons
function createRotatedIcon(baseIcon, rotation) {
    return L.divIcon({
        className: 'rotated-plane-icon',
        html: `<img src="${baseIcon.options.iconUrl}" style="width: ${baseIcon.options.iconSize[0]}px; height: ${baseIcon.options.iconSize[1]}px; transform: rotate(${rotation}deg); transform-origin: center;">`,
        iconSize: baseIcon.options.iconSize,
        iconAnchor: baseIcon.options.iconAnchor
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const mapEl = document.getElementById("map");
    if (!mapEl) {
        return;
    }

    const cs = window.getComputedStyle(mapEl);
    if (!cs || cs.height === "0px" || mapEl.clientHeight === 0) {
        mapEl.style.height = "100vh";
    }

    map = L.map("map").setView([51.7787, -0.2636], 6);
    tileLayer.addTo(map);

    if (L.terminator) {
        L.terminator({
            fillColor: "#000000ff",
            fillOpacity: 0.4,
        }).addTo(map);
    } else {
        console.error("L.terminator plugin not loaded");
    }

    coordsControl.addTo(map);
    map.on("mousemove", (e) => {
        const lat = e.latlng.lat.toFixed(5);
        const lng = e.latlng.lng.toFixed(5);
        coordsControl.getContainer().innerHTML = `Lat: ${lat}, Lng: ${lng}`;
    });

    map.on("click", (e) => {
        const flightInfo = document.querySelector(".mobile-flight-menu");

        flightInfo.style = "transform: translate(-50%, 100%)";

        activeRoutes.forEach((routeData) => {
            map.removeLayer(routeData.polyline);
            map.removeLayer(routeData.depMarker);
            map.removeLayer(routeData.arrMarker);
        });
        activeRoutes.clear();
    });

    map.whenReady(() => {
        displayPlane();
    });
});

function handleRouteProgress(
    dep_lat,
    dep_lng,
    planePos_lat,
    planePos_lng,
    arr_lat,
    arr_lng,
    routeId
) {
    // Entferne alle vorherigen Routen
    activeRoutes.forEach((routeData) => {
        map.removeLayer(routeData.polyline);
        map.removeLayer(routeData.depMarker);
        map.removeLayer(routeData.arrMarker);
    });
    activeRoutes.clear();

    //? 1. Great Circle Route zwischen Start und Ziel

    let dep = [dep_lat, dep_lng];
    let arr = [arr_lat, arr_lng];
    let planePos = [planePos_lat, planePos_lng];

    const curvePoints = createCurve(dep, planePos, arr, 200);

    const polyline = L.polyline(curvePoints, {
        color: "orange",
        weight: 2,
        renderer: canvasRenderer,
        smoothFactor: 1.5
    }).addTo(map);

    //* 2. Berechnen wo das Flugzeug auf der Route ist

    const flown = haversineDistanceKM(
        dep_lat,
        dep_lng,
        planePos_lat,
        planePos_lng
    );
    const toFly = haversineDistanceKM(
        planePos_lat,
        planePos_lng,
        arr_lat,
        arr_lng
    );
    const totalDistance = flown + toFly;
    const progress = flown / totalDistance;

    const { depMarker, arrMarker } = setAirports(
        dep_lat,
        dep_lng,
        arr_lat,
        arr_lng
    );

    activeRoutes.set(routeId, { polyline, depMarker, arrMarker });
    map.flyTo([planePos_lat, planePos_lng], 8);

    // Hier die Funktion aufrufen

    return progress;
}

function haversineDistanceKM(lat1Deg, lon1Deg, lat2Deg, lon2Deg) {
    function toRad(degree) {
        return (degree * Math.PI) / 180;
    }

    const lat1 = toRad(lat1Deg);
    const lon1 = toRad(lon1Deg);
    const lat2 = toRad(lat2Deg);
    const lon2 = toRad(lon2Deg);

    const { sin, cos, sqrt, atan2 } = Math;

    const R = 6371; // earth radius in km
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a =
        sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1) * cos(lat2) * sin(dLon / 2) * sin(dLon / 2);
    const c = 2 * atan2(sqrt(a), sqrt(1 - a));
    const d = R * c;
    return d; // distance in km
}

function createCurve(dep, planePos, arr, steps) {
    // Berechne die Great Circle Distanzen
    const dist_dep_plane = haversineDistanceKM(
        dep[0],
        dep[1],
        planePos[0],
        planePos[1]
    );
    const dist_plane_arr = haversineDistanceKM(
        planePos[0],
        planePos[1],
        arr[0],
        arr[1]
    );
    const totalDist = dist_dep_plane + dist_plane_arr;

    // Verhältnis: Wie viele Punkte vor/nach der Flugzeugposition?
    const stepsToPlane = Math.round(steps * (dist_dep_plane / totalDist));
    const stepsToArr = steps - stepsToPlane;

    // Erstelle zwei Great Circle Segmente
    const segment1 = createGreatCircle(dep, planePos, stepsToPlane);
    const segment2 = createGreatCircle(planePos, arr, stepsToArr);

    // Entferne doppelte Flugzeugposition (segment2[0] == segment1[last])
    return [...segment1, ...segment2.slice(1)];
}

function createGreatCircle(p1, p2, steps) {
    const curve = [];

    const lat1 = (p1[0] * Math.PI) / 180;
    const lon1 = (p1[1] * Math.PI) / 180;
    const lat2 = (p2[0] * Math.PI) / 180;
    const lon2 = (p2[1] * Math.PI) / 180;

    const d = Math.acos(
        Math.sin(lat1) * Math.sin(lat2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
    );

    // Fallback für sehr kurze Distanzen
    if (d < 0.0001) {
        return [p1, p2];
    }

    for (let i = 0; i <= steps; i++) {
        const f = i / steps;

        const A = Math.sin((1 - f) * d) / Math.sin(d);
        const B = Math.sin(f * d) / Math.sin(d);

        const x =
            A * Math.cos(lat1) * Math.cos(lon1) +
            B * Math.cos(lat2) * Math.cos(lon2);
        const y =
            A * Math.cos(lat1) * Math.sin(lon1) +
            B * Math.cos(lat2) * Math.sin(lon2);
        const z = A * Math.sin(lat1) + B * Math.sin(lat2);

        const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
        const lon = Math.atan2(y, x);

        curve.push([(lat * 180) / Math.PI, (lon * 180) / Math.PI]);
    }

    return curve;
}

function handlePosition(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    if (map) {
        map.setView([lat, lng], 8);
    }
}

function displayPlane() {
    window.activePlanes.forEach((p, key) => {
        // Überspringe, wenn der Marker bereits existiert
        if (planeMarkers.has(key)) {
            return;
        }

        const aircraftType = p.aircraft_type;
        const rotation = p.deg || 0;

        let icon;
        if (
            aircraftType.includes("380") ||
            aircraftType.includes("747") ||
            aircraftType.includes("340")
        ) {
            icon = createRotatedIcon(planeIcon4, rotation);
        } else {
            icon = createRotatedIcon(planeIcon2, rotation);
        }
        
        const plane = L.marker([p.lat, p.long], { icon: icon }).addTo(map);

        plane.addEventListener("click", async (_) => {
            // Lade Flughafenkoordinaten aus airports-slim.json
            const depAirport = await getAirport(p.dep);
            const arrAirport = await getAirport(p.arr);

            if (depAirport === "Kein Eintrag vorhanden" || arrAirport === "Kein Eintrag vorhanden") {
                console.error(`Flughafen nicht gefunden: ${p.dep} oder ${p.arr}`);
                return;
            }

            const progress = handleRouteProgress(
                depAirport.lat,
                depAirport.lng,
                p.lat,
                p.long,
                arrAirport.lat,
                arrAirport.lng,
                key
            );

            updateFlightInfo(
                key,
                p.aircraft_type,
                p.dep,
                p.arr,
                progress * 100
            );
        });

        // Speichere Marker für spätere Updates
        planeMarkers.set(key, plane);
    });
}

function updatePlaneMarkers() {
    if (!map || isUpdating) return;
    
    isUpdating = true;

    // Hole die Kartenbounds für Sichtbarkeits-Check
    const bounds = map.getBounds();

    // Aktualisiere existierende Marker oder erstelle neue
    window.activePlanes.forEach((p, key) => {
        // Prüfe ob Flugzeug im sichtbaren Bereich ist
        const isVisible = bounds.contains([p.lat, p.long]);
        
        const aircraftType = p.aircraft_type || '';
        const rotation = p.deg || 0;
        
        // Bestimme das richtige Icon basierend auf Flugzeugtyp
        let baseIcon = (aircraftType.includes("380") || 
                        aircraftType.includes("747") || 
                        aircraftType.includes("340")) ? planeIcon4 : planeIcon2;
        
        if (planeMarkers.has(key)) {
            // Aktualisiere Position des existierenden Markers
            const marker = planeMarkers.get(key);
            marker.setLatLng([p.lat, p.long]);
            
            // Nur Icon updaten wenn sichtbar (Performance)
            if (isVisible) {
                let icon = createRotatedIcon(baseIcon, rotation);
                marker.setIcon(icon);
            }
        } else if (isVisible) {
            // Erstelle neuen Marker nur wenn sichtbar
            let icon = createRotatedIcon(baseIcon, rotation);
            let plane = L.marker([p.lat, p.long], { icon: icon }).addTo(map);

            plane.addEventListener("click", async (_) => {
                // Lade Flughafenkoordinaten aus airports-slim.json
                const depAirport = await getAirport(p.dep);
                const arrAirport = await getAirport(p.arr);

                if (depAirport === "Kein Eintrag vorhanden" || arrAirport === "Kein Eintrag vorhanden") {
                    console.error(`Flughafen nicht gefunden: ${p.dep} oder ${p.arr}`);
                    return;
                }

                const progress = handleRouteProgress(
                    depAirport.lat,
                    depAirport.lng,
                    p.lat,
                    p.long,
                    arrAirport.lat,
                    arrAirport.lng,
                    key
                );

                updateFlightInfo(
                    key,
                    p.aircraft_type,
                    p.dep,
                    p.arr,
                    progress * 100
                );
            });

            planeMarkers.set(key, plane);
        }
    });

    // Entferne Marker für Flugzeuge, die nicht mehr in activePlanes sind
    planeMarkers.forEach((marker, key) => {
        if (!window.activePlanes.has(key)) {
            map.removeLayer(marker);
            planeMarkers.delete(key);
        }
    });
    
    isUpdating = false;
}

function setAirports(dep_lat, dep_lng, arr_lat, arr_lng) {
    const depMarker = L.marker([dep_lat, dep_lng])
        .addTo(map)
        .bindPopup("Start", { className: "customMarker" });
    const arrMarker = L.marker([arr_lat, arr_lng])
        .addTo(map)
        .bindPopup("Ziel", { className: "customMarker" });

    return { depMarker, arrMarker };
}

async function getAirport(short) {
    try {
        const response = await fetch("./json/airports-slim.json");
        const data = await response.json();
        const airport = data.airports.find((a) => a.iata === short);

        if (airport) {
            console.log(airport.name);
            return {
                name: airport.name,
                lat: airport.lat,
                lng: airport.lng
            };
        }
        return "Kein Eintrag vorhanden";
    } catch (err) {
        console.error(err);
        return "Kein Eintrag zu diesem Kürzel";
    }
}

async function updateFlightInfo(ap_icao, ap_type, dep, arr, progress) {
    const icao = document.querySelector(".flight-icao");
    const aircraft = document.querySelector(".flight-aircraft");
    const flight_dep = document.querySelector(".flight-dep-iata");
    const flight_dep_name = document.querySelector(".flight-dep-name");
    const flight_arr = document.querySelector(".flight-arr-iata");
    const flight_arr_name = document.querySelector(".flight-arr-name");
    const flight_progress = document.querySelector(".progress-max");

    // Mobile elements
    const mobile_icao = document.querySelector(".mobile-flight-icao");
    const mobile_aircraft = document.querySelector(".mobile-flight-aircraft");
    const mobile_dep = document.querySelector(".mobile-flight-dep-iata");
    const mobile_dep_name = document.querySelector(".mobile-flight-dep-name");
    const mobile_arr = document.querySelector(".mobile-flight-arr-iata");
    const mobile_arr_name = document.querySelector(".mobile-flight-arr-name");
    const mobile_progress = document.querySelector(
        ".mobile-flight-menu .progress-max"
    );

    const flightInfo = document.querySelector(".mobile-flight-menu");

    flightInfo.style = "transform: translate(-50%, 0%)";

    const depAirport = await getAirport(dep);
    const arrAirport = await getAirport(arr);

    const depName = depAirport !== "Kein Eintrag vorhanden" ? depAirport.name : dep;
    const arrName = arrAirport !== "Kein Eintrag vorhanden" ? arrAirport.name : arr;

    // Desktop (nur wenn Elemente existieren)
    if (icao) icao.innerHTML = ap_icao;
    if (aircraft) aircraft.innerHTML = ap_type;
    if (flight_dep) flight_dep.innerHTML = dep;
    if (flight_dep_name) flight_dep_name.innerHTML = depName;
    if (flight_arr) flight_arr.innerHTML = arr;
    if (flight_arr_name) flight_arr_name.innerHTML = arrName;
    if (flight_progress)
        flight_progress.style.setProperty("--after-width", `${progress}%`);

    // Mobile
    if (mobile_icao) mobile_icao.innerHTML = ap_icao;
    if (mobile_aircraft) mobile_aircraft.innerHTML = ap_type;
    if (mobile_dep) mobile_dep.innerHTML = dep;
    if (mobile_dep_name) mobile_dep_name.innerHTML = depName;
    if (mobile_arr) mobile_arr.innerHTML = arr;
    if (mobile_arr_name) mobile_arr_name.innerHTML = arrName;
    if (mobile_progress)
        mobile_progress.style.setProperty("--after-width", `${progress}%`);
}
