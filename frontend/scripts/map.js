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
            fillColor: '#000000',
            fillOpacity: 0.4
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

    handleSideBar()
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

function handlePosition(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    if (map) {
        map.setView([lat, lng], 8);
    }
}

function handleError(err) {
    console.warn('Geolocation error:', err);
}