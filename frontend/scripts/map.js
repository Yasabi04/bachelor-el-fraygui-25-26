let map = null;
let activeRoutes = new Map(); // Speichert aktive Routen für Toggle

const tileLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        maxZoom: 15,
    }
);

const canvasRenderer = L.canvas({ padding: 0.5 });
const coordsControl = L.control({ position: "bottomleft" });
coordsControl.onAdd = () => {
    const div = L.DomUtil.create("div", "coords");
    div.style.padding = "0.4rem";
    div.style.background = "rgba(255,255,255,0.9)";
    div.style.fontFamily = "monospace";
    div.innerHTML = "Lat: -, Lng: -";
    return div;
};

const planeIcon = L.icon({
    iconUrl: "./img/flg-zweistrahlig.svg",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

document.addEventListener("DOMContentLoaded", async () => {
    // Sicherstellen, dass map-Container eine Höhe hat
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

    map.whenReady(() => {
        displayPlane();
    });
});

// if ("geolocation" in navigator) {
//     navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
//         enableHighAccuracy: true,
//         timeout: 10000,
//         maximumAge: 0,
//     });
// } else {
//     const lH = document.querySelector(".location-header");
//     lH.innerHTML = "Geolocation wird von diesem Browser nicht unterstützt.";
// }

function handleRouteProgress(
    dep_lat,
    dep_lng,
    planePos_lat,
    planePos_lng,
    arr_lat,
    arr_lng,
    routeId
) {
    // Toggle: Wenn Route schon existiert, entfernen
    if (activeRoutes.has(routeId)) {
        const route = activeRoutes.get(routeId);
        map.removeLayer(route);
        activeRoutes.delete(routeId);
        return;
    }

    //? 1. Great Circle Route zwischen Start und Ziel

    let dep = [dep_lat, dep_lng];
    let arr = [arr_lat, arr_lng];
    let planePos = [planePos_lat, planePos_lng];

    const curvePoints = createCurve(dep, planePos, arr, 100);

    const polyline = L.polyline(curvePoints, {
        color: "orange",
        weight: 2,
    }).addTo(map);

    activeRoutes.set(routeId, polyline);

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

function handleError(err) {
    console.warn("Geolocation error:", err);
}

function displayPlane() {
    const a = L.marker([51.74744, -0.18678], { icon: planeIcon }).addTo(map);
    const b = L.marker([48.1103, 16.5697], { icon: planeIcon }).addTo(map);
    const c = L.marker([51.0379, 2.5622], { icon: planeIcon }).addTo(map);

    a.addEventListener("click", (_) => {
        handleRouteProgress(
            40.6413, // JFK New York (Departure lat)
            -73.7781, // JFK New York (Departure lng)
            51.74744, // Paris (Plane position lat)
            -0.18678, // Paris (Plane position lng)
            50.0379, // Frankfurt (Arrival lat)
            8.5622, // Frankfurt (Arrival lng)
            "route-a" // Route ID für Toggle
        );
    });

    b.addEventListener("click", (_) => {
        handleRouteProgress(
            35.5494,
            139.7798,
            48.1103,
            16.5697,
            48.3538,
            11.7861,
            "route-b" // Route ID ICAO-Code nutzen
        )
    });

    c.addEventListener("click",  _ => {
        handleRouteProgress(
            50.0379,
            8.5622,
            51.0379,
            2.5622,
            51.4700,
            -0.4543
        )
    })
}
