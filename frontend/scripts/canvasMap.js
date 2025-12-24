let map = null;
let aircraftLayer = null;
let activeRoutes = new Map();

// Fallback Test-Daten
if (!window.activePlanes) {
    window.activePlanes = new Map();

    window.activePlanes.set("LH810", {
        aircraft_type: "AIRBUS A320 - 200",
        lat: 51.43,
        long: 3.21,
        dep: "FRA",
        arr: "JFK",
        deg: 45,
    });

    window.activePlanes.set("CA7289", {
        aircraft_type: "Boeing 777-200",
        lat: 52.15,
        long: -35.2,
        dep: "YVR",
        arr: "FCO",
        deg: 90,
    });
}

const tileLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        maxZoom: 19,
    }
);

// Canvas Layer für Flugzeuge - synchronisiert mit Map-Transformationen
L.CanvasLayer = L.Layer.extend({
    initialize(aircrafts) {
        this.aircrafts = aircrafts;
    },

    onAdd(map) {
        this.map = map;
        this.dpr = window.devicePixelRatio || 1;

        this.canvas = L.DomUtil.create("canvas", "leaflet-aircraft-layer");
        this.ctx = this.canvas.getContext("2d");

        // Canvas wird fest an die Map gebunden - OHNE Transform
        this.canvas.style.position = "absolute";
        this.canvas.style.top = "0";
        this.canvas.style.left = "0";
        this.canvas.style.pointerEvents = "none";
        this.canvas.style.zIndex = "400"; // Über overlayPane (400) aber unter popupPane (600)

        const size = map.getSize();
        this.canvas.width = size.x * this.dpr;
        this.canvas.height = size.y * this.dpr;
        this.canvas.style.width = size.x + "px";
        this.canvas.style.height = size.y + "px";
        this.ctx.scale(this.dpr, this.dpr);

        // Füge Canvas direkt zum Map-Container hinzu, NICHT zum overlayPane
        map.getContainer().appendChild(this.canvas);

        // Kontinuierliche Updates während aller Map-Events
        map.on("move", this._onMove, this);
        map.on("viewreset", this._onViewReset, this);
        map.on("zoom", this._onMove, this);
        map.on("zoomstart", this._onMove, this);
        map.on("zoomend", this._onViewReset, this);
        map.on("moveend", this._onMove, this);
        map.on("resize", this._onViewReset, this);

        this._onViewReset();
    },

    onRemove(map) {
        L.DomUtil.remove(this.canvas);
        map.off(
            "move viewreset zoom zoomstart zoomend moveend resize",
            this._onMove,
            this
        );
    },

    _onMove() {
        this._redraw();
    },

    _onViewReset() {
        // Bei Reset/Ende: Canvas-Größe anpassen und neuzeichnen
        const size = this.map.getSize();
        const targetWidth = size.x * this.dpr;
        const targetHeight = size.y * this.dpr;

        if (
            this.canvas.width !== targetWidth ||
            this.canvas.height !== targetHeight
        ) {
            this.canvas.width = targetWidth;
            this.canvas.height = targetHeight;
            this.canvas.style.width = size.x + "px";
            this.canvas.style.height = size.y + "px";
            this.ctx.scale(this.dpr, this.dpr);
        }
        this._redraw();
    },

    _redraw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const bounds = this.map.getBounds().pad(0.1);
        const zoom = this.map.getZoom();

        const maxAircraft = this._getMaxAircraftForZoom(zoom);
        let drawnCount = 0;

        for (const a of this.aircrafts) {
            if (!bounds.contains([a.lat, a.lng])) {
                continue;
            }

            if (drawnCount >= maxAircraft) {
                break;
            }

            const p = this.map.latLngToContainerPoint([a.lat, a.lng]);
            drawAircraft(ctx, p.x, p.y, a.heading || 0, a.type);
            drawnCount++;
        }
    },

    _getMaxAircraftForZoom(zoom) {
        if (zoom <= 3) return 100; // Weltkarte: nur 10 Flugzeuge
        if (zoom <= 5) return 50; // Kontinent: 50 Flugzeuge
        if (zoom <= 7) return 200; // Land: 200 Flugzeuge
        if (zoom <= 9) return 500; // Region: 500 Flugzeuge
        return Infinity; // Nah rangezoomt: alle Flugzeuge
    },

    updateAircrafts(aircrafts) {
        this.aircrafts = aircrafts;
        this._redraw();
    },

    pick(x, y) {
        const bounds = this.map.getBounds();
        const R = 14;

        for (const a of this.aircrafts) {
            if (!bounds.contains([a.lat, a.lng])) continue;

            const p = this.map.latLngToContainerPoint([a.lat, a.lng]);
            const dx = x - p.x;
            const dy = y - p.y;

            if (dx * dx + dy * dy < R * R) {
                return a;
            }
        }
        return null;
    },
});

const planeImg = new Image();
planeImg.src = "./img/flg-zweistrahlig.svg";

function drawAircraft(ctx, x, y, heading, type) {
    ctx.save();

    // Optimale Rendering-Einstellungen für scharfe SVGs
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.translate(x, y);
    ctx.rotate((heading * Math.PI) / 180);

    const is4Engine =
        type &&
        (type.includes("380") || type.includes("747") || type.includes("340"));
    const size = is4Engine ? 34 : 32;

    ctx.drawImage(planeImg, -size / 2, -size / 2, size, size);

    ctx.restore();
}

function updateInfo(iata, airplane_type, dep, arr) {
    
}

document.addEventListener("DOMContentLoaded", async () => {
    const mapEl = document.getElementById("map");
    if (!mapEl) {
        console.error("Map element not found");
        return;
    }

    const cs = window.getComputedStyle(mapEl);
    if (!cs || cs.height === "0px" || mapEl.clientHeight === 0) {
        mapEl.style.height = "100vh";
    }

    // Erstelle Map
    map = L.map("map").setView([51.7787, -0.2636], 6);
    tileLayer.addTo(map);

    if (L.terminator) {
        L.terminator({
            fillColor: "#000000ff",
            fillOpacity: 0.4,
        }).addTo(map);
    }

    // Koordinaten-Anzeige
    const coordsControl = L.control({ position: "bottomleft" });
    coordsControl.onAdd = () => {
        const div = L.DomUtil.create("div", "coords");
        div.style.padding = "0.4rem";
        div.style.background = "rgba(183, 213, 248, 0.74)";
        div.style.fontFamily = "monospace";
        div.innerHTML = "Lat: -, Lng: -";
        return div;
    };
    coordsControl.addTo(map);

    map.on("mousemove", (e) => {
        const lat = e.latlng.lat.toFixed(5);
        const lng = e.latlng.lng.toFixed(5);
        coordsControl.getContainer().innerHTML = `Lat: ${lat}, Lng: ${lng}`;

        const p = map.latLngToContainerPoint(e.latlng);
        const hovered = aircraftLayer.pick(p.x, p.y);

        map.getContainer().style.cursor = hovered ? "pointer" : "";
    });

    map.on("click", (e) => {
        const p = map.latLngToContainerPoint(e.latlng);
        const clicked = aircraftLayer.pick(p.x, p.y);

        if (clicked) {
            console.log("Angeklicktes Flugzeug:", clicked);
        }
    });

    // Erstelle Aircraft Layer
    const aircrafts = Array.from(window.activePlanes.entries()).map(
        ([key, p]) => ({
            iata: key,
            lat: p.lat,
            lng: p.long,
            heading: p.deg || 0,
            type: p.aircraft_type,
        })
    );

    aircraftLayer = new L.CanvasLayer(aircrafts);
    aircraftLayer.addTo(map);

    // Update bei neuen Daten
    window.addEventListener("activePlanesUpdated", () => {
        const updatedAircrafts = Array.from(window.activePlanes.entries()).map(
            ([key, p]) => ({
                iata: key,
                lat: p.lat,
                lng: p.long,
                heading: p.deg || 0,
                type: p.aircraft_type,
            })
        );
        if (aircraftLayer) {
            aircraftLayer.updateAircrafts(updatedAircrafts);
        }
    });
});
