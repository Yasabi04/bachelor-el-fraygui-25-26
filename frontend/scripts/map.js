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
        handleRouteProgress(
            40.6413, // JFK New York (Departure lat)
            -73.7781, // JFK New York (Departure lng)
            60.8566, // Paris (Plane position lat)
            -36.3522, // Paris (Plane position lng)
            50.0379, // Frankfurt (Arrival lat)
            8.5622 // Frankfurt (Arrival lng)
        );
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
    //? 1. Runde Linie zeichnen, zwischen allen drei Punkten

    let dep = [dep_lat, dep_lng];
    let planePos = [planePos_lat, planePos_lng];
    let arr = [arr_lat, arr_lng];

    const curvePoints = createCurve(dep, planePos, arr, 100);

    L.polyline(curvePoints, {
        color: "orange",
        weight: 5,
    }).addTo(map);

    //* 2. Distanz zurückgeben

    // Distanz a = dep -> planePos

    const flown = haversineDistanceKM(
        dep_lat,
        dep_lng,
        planePos_lat,
        planePos_lng
    );

    // Distanz b = planePos -> arr

    const toFly = haversineDistanceKM(
        planePos_lat,
        planePos_lng,
        arr_lat,
        arr_lng
    );

    return flown / (flown + toFly);
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
    const curve = [];

    for (let t = 0; t <= 1; t += 1 / steps) {
        const lat =
            (1 - t) * (1 - t) * p1[0] + 2 * (1 - t) * t * p2[0] + t * t * p3[0];

        const lng =
            (1 - t) * (1 - t) * p1[1] + 2 * (1 - t) * t * p2[1] + t * t * p3[1];

        curve.push([lat, lng]);
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
