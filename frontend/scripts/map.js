let map = null;

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
    iconAnchor: [16, 32]
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

    map = L.map("map").setView([51.1657, 10.4515], 6);
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

    // Warte bis die Karte geladen ist
    map.whenReady(() => {
        displayPlane();
    });
});

if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
    });
} else {
    const lH = document.querySelector(".location-header");
    lH.innerHTML = "Geolocation wird von diesem Browser nicht unterstützt.";
}

function handleRouteProgress(
    dep_lat,
    dep_lng,
    planePos_lat,
    planePos_lng,
    arr_lat,
    arr_lng
) {
    //? 1. Great Circle Route zwischen Start und Ziel

    let dep = [dep_lat, dep_lng];
    let arr = [arr_lat, arr_lng];

    const curvePoints = createCurve(dep, null, arr, 100);

    L.polyline(curvePoints, {
        color: "orange",
        weight: 5,
    }).addTo(map);

    //* 2. Berechne wo das Flugzeug auf der Route sein sollte

    const flown = haversineDistanceKM(dep_lat, dep_lng, planePos_lat, planePos_lng);
    const toFly = haversineDistanceKM(planePos_lat, planePos_lng, arr_lat, arr_lng);
    const totalDistance = flown + toFly;
    const progress = flown / totalDistance;

    // Finde den Punkt auf der Great Circle Route basierend auf dem Fortschritt
    const pointIndex = Math.round(progress * (curvePoints.length - 1));
    const planePositionOnRoute = curvePoints[pointIndex];

    // Platziere das Flugzeug-Icon auf der Route
    L.marker(planePositionOnRoute, { icon: planeIcon }).addTo(map);

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

function createCurve(p1, p2, p3, steps) {
    // Great Circle Route zwischen Start und Ziel
    const curve = [];
    
    // Konvertiere zu Radians
    const lat1 = (p1[0] * Math.PI) / 180;
    const lon1 = (p1[1] * Math.PI) / 180;
    const lat2 = (p3[0] * Math.PI) / 180;
    const lon2 = (p3[1] * Math.PI) / 180;
    
    const d = Math.acos(
        Math.sin(lat1) * Math.sin(lat2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
    );
    
    for (let i = 0; i <= steps; i++) {
        const f = i / steps;
        
        const A = Math.sin((1 - f) * d) / Math.sin(d);
        const B = Math.sin(f * d) / Math.sin(d);
        
        const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
        const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
        const z = A * Math.sin(lat1) + B * Math.sin(lat2);
        
        const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
        const lon = Math.atan2(y, x);
        
        curve.push([
            (lat * 180) / Math.PI,
            (lon * 180) / Math.PI
        ]);
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
    const a = L.marker([51.74744, -0.17578], { icon: planeIcon }).addTo(map);

    a.addEventListener("click", (_) => {
        handleRouteProgress(
            40.6413, // JFK New York (Departure lat)
            -73.7781, // JFK New York (Departure lng)
            51.74744, // Paris (Plane position lat)
            -0.17578, // Paris (Plane position lng)
            50.0379, // Frankfurt (Arrival lat)
            8.5622 // Frankfurt (Arrival lng)
        );
    });
}
