let map = null;
let aircraftLayer = null;
let activeRoutes = new Map();

const tileLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        // attribution: "&copy; contributors",
        maxZoom: 19,
        minZoom: 2,
    },
);

const canvasRenderer = L.canvas({
    padding: 0.5,
    tolerance: 5,
    updateWhenIdle: false,
    updateWhenZooming: false,
});

L.CanvasLayer = L.Layer.extend({
    initialize(aircrafts) {
        this.aircrafts = aircrafts;
        this.hoveredAircraft = null;
        this.selectedAircraft = null;
    },

    onAdd(map) {
        this.map = map;
        this.dpr = window.devicePixelRatio || 1;

        this.canvas = L.DomUtil.create("canvas", "leaflet-aircraft-layer");
        this.ctx = this.canvas.getContext("2d");

        this.canvas.style.position = "absolute";
        this.canvas.style.top = "0";
        this.canvas.style.left = "0";
        this.canvas.style.pointerEvents = "none";
        this.canvas.style.zIndex = "400"; 

        const size = map.getSize();
        this.canvas.width = size.x * this.dpr;
        this.canvas.height = size.y * this.dpr;
        this.canvas.style.width = size.x + "px";
        this.canvas.style.height = size.y + "px";
        this.ctx.scale(this.dpr, this.dpr);

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
            this,
        );
    },

    _onMove() {
        this._redraw();
    },

    _onViewReset() {
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

        if (
            this.selectedAircraft &&
            bounds.contains([
                this.selectedAircraft.lat,
                this.selectedAircraft.lng,
            ])
        ) {
            const p = this.map.latLngToContainerPoint([
                this.selectedAircraft.lat,
                this.selectedAircraft.lng,
            ]);
            drawAircraft(
                ctx,
                p.x,
                p.y,
                this.selectedAircraft.heading || 0,
                this.selectedAircraft.type,
                false,
                true,
            );
            drawnCount++;
        }

        for (const a of this.aircrafts) {
            if (a == this.selectedAircraft) {
                continue;
            }

            if (!bounds.contains([a.lat, a.lng])) {
                continue;
            }

            if (drawnCount >= maxAircraft) {
                break;
            }

            const p = this.map.latLngToContainerPoint([a.lat, a.lng]);
            const isHovered = this.hoveredAircraft === a;

            const planeData = window.activePlanes.get(a.icao);
            const isSelected = planeData ? planeData.isSelected : false;

            drawAircraft(
                ctx,
                p.x,
                p.y,
                a.heading || 0,
                a.type,
                isHovered,
                isSelected,
            );
            drawnCount++;
        }
    },

    _getMaxAircraftForZoom(zoom) {
        if (zoom <= 3) return 70; // Weltkarte: nur 70 Flugzeuge
        if (zoom <= 5) return 100; // Kontinent: 100 Flugzeuge
        if (zoom <= 7) return 200; // Land: 200 Flugzeuge
        if (zoom <= 9) return 500; // Region: 500 Flugzeuge
        return Infinity;
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

    setHovered(aircraft) {
        if (this.hoveredAircraft !== aircraft) {
            this.hoveredAircraft = aircraft;
            this._redraw();
        }
    },

    setSelected(aircraft) {
        if (this.selectedAircraft) {
            const prevPlane = window.activePlanes.get(
                this.selectedAircraft.icao,
            );
            if (prevPlane) {
                prevPlane.isSelected = false;
            }
        }

        if (aircraft) {
            const plane = window.activePlanes.get(aircraft.icao);
            if (plane) {
                plane.isSelected = true;
            }
        }

        this.selectedAircraft = aircraft;
        this._redraw();
    },
});

const planeImg2 = new Image();
planeImg2.src = "./img/flg-zweistrahlig.svg";

const planeImg2Highlight = new Image();
planeImg2Highlight.src = "./img/flg-zweistrahlig-highlight.svg";

const planeImg4 = new Image();
planeImg4.src = "./img/flg-vierstrahlig.svg";

const planeImg4Highlight = new Image();
planeImg4Highlight.src = "./img/flg-vierstrahlig-highlight.svg";

function drawAircraft(ctx, x, y, heading, type, isHovered, isSelected) {
    ctx.save();

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.translate(x, y);
    ctx.rotate((heading * Math.PI) / 180);

    const is4Engine =
        type &&
        (type.includes("A38") || type.includes("B74") || type.includes("A34"));
    const size = is4Engine ? 30 : 24;

    let img;
    if (is4Engine) {
        img = isSelected || isHovered ? planeImg4Highlight : planeImg4;
    } else {
        img = isSelected || isHovered ? planeImg2Highlight : planeImg2;
    }
    ctx.drawImage(img, -size / 2, -size / 2, size, size);

    ctx.restore();
}

async function getAirport(short) {
    try {
        const response = await fetch("./json/airports-collection.json");
        const data = await response.json();
        const airport = data.find(
            (a) => a.iata_code === short 
        );

        if (airport) {
            return {
                name: airport.municipality, // Oder airport.name für Flughafennamen
                lat: airport.coordinates.lat,
                lng: airport.coordinates.lng,
            };
        }
        return "Kein Eintrag vorhanden";
    } catch (err) {
        console.error(err);
        return "Kein Eintrag zu diesem Kürzel";
    }
}

async function getElaboration(abbr) {
    try {
        const req = await fetch("./json/airplane-abbr.json");
        const data = await req.json();

        const word = data.airplanes.find((e) => e.abbr == abbr);

        return word.elab;
    } catch (error) {
        console.log(error);
        return abbr;
    }
}

async function getAbbriviation(elab) {
    try {
        const req = await fetch("./json/airplane-abbr.json");
        const data = await req.json();

        const word = data.airplanes.find((e) => e.elab == elab);

        return word.abbr;
    } catch (error) {
        console.log(error);
        return elab;
    }
}

async function getCityAbbr(start, finish) {
    try {
        let startAbbr = []
        let finishAbbr = []
        const req = await fetch("./json/airports-collection.json");
        const airports = await req.json();
        const startQuery = (start || "").toLowerCase();
        const finishQuery = (finish || "").toLowerCase();

        for (const airport of airports) {
            const name = (airport.name || "").toLowerCase();
            const municipality = (airport.municipality || "").toLowerCase();

            if (startQuery && (name.includes(startQuery) || municipality.includes(startQuery))) {
                if (airport.iata_code) {
                    startAbbr.push(airport.iata_code);
                }
            }
            if (finishQuery && (name.includes(finishQuery) || municipality.includes(finishQuery))) {
                if (airport.iata_code) {
                    finishAbbr.push(airport.iata_code);
                }
            }
        }
        
        return {
            possibleStarts: startAbbr,
            possibleFinishes: finishAbbr,
        }
    }
    catch(error) {
        return {
            error: error
        }
    }
}

async function updateInfo(icao, airplane_type, dep, arr, progress) {
    const mobile_icao = document.querySelector(".mobile-flight-icao");
    const mobile_aircraft = document.querySelector(".mobile-flight-aircraft");
    const mobile_dep = document.querySelector(".mobile-flight-dep-iata");
    const mobile_dep_name = document.querySelector(".mobile-flight-dep-name");
    const mobile_arr = document.querySelector(".mobile-flight-arr-iata");
    const mobile_arr_name = document.querySelector(".mobile-flight-arr-name");
    const mobile_progress = document.querySelector(
        ".mobile-flight-menu .progress-max",
    );

    const depAirport = await getAirport(dep);
    const arrAirport = await getAirport(arr);
    const longType = await getElaboration(airplane_type);

    if(!(depAirport && arrAirport && longType)) {
        setError('Huch!', 'Fluginformationen konnten nicht ausgelesen werden.');
        return;
    }

    const flightInfo = document.querySelector(".mobile-flight-menu");
    flightInfo.style = "transform: translate(-50%, 0%)";

    const depName =
        depAirport !== "Kein Eintrag vorhanden" ? depAirport.name : dep;
    const arrName =
        arrAirport !== "Kein Eintrag vorhanden" ? arrAirport.name : arr;

    if (mobile_icao) mobile_icao.innerHTML = icao;
    if (mobile_aircraft) mobile_aircraft.innerHTML = longType;
    if (mobile_dep) mobile_dep.innerHTML = dep;
    if (mobile_dep_name) mobile_dep_name.innerHTML = depName;
    if (mobile_arr) mobile_arr.innerHTML = arr;
    if (mobile_arr_name) mobile_arr_name.innerHTML = arrName;
    if (mobile_progress)
        mobile_progress.style.setProperty(
            "--after-width",
            `${Math.round(progress * 100)}%`,
        );
}

function setAirports(dep_lat, dep_lng, arr_lat, arr_lng) {
    const depMarker = L.marker([dep_lat, dep_lng]).addTo(map);
    const arrMarker = L.marker([arr_lat, arr_lng]).addTo(map);

    return { depMarker, arrMarker };
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

    map = L.map("map", { zoomControl: false }).setView([51.7787, -0.2636], 4);
    tileLayer.addTo(map);

    if (L.terminator) {
        L.terminator({
            fillColor: "#000000ff",
            fillOpacity: 0.4,
        }).addTo(map);
    }

    const coordsControl = L.control({ position: "bottomleft" });
    coordsControl.onAdd = () => {
        const div = L.DomUtil.create("div", "coords");
        div.style.padding = "0.4rem"; 
        div.style.background = "white";
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

        aircraftLayer.setHovered(hovered);
        map.getContainer().style.cursor = hovered ? "pointer" : "";
    });

    map.on("click", async (e) => {
        const p = map.latLngToContainerPoint(e.latlng);
        const clicked = aircraftLayer.pick(p.x, p.y);

        if (clicked) {
            aircraftLayer.setSelected(clicked);

            const newICAOUrl = `${window.location.pathname}?icao=${clicked.icao}`;
            window.history.replaceState(null, "", newICAOUrl);

            await handleSelectedPlane(clicked)
            
        } else {
            window.activePlanes.forEach((plane) => {
                plane.isSelected = false;
            });

            aircraftLayer.setSelected(null);
            activeRoutes.forEach((routeData) => {
                if (routeData.polylineStart)
                    map.removeLayer(routeData.polylineStart);
                if (routeData.polylineEnde)
                    map.removeLayer(routeData.polylineEnde);
                if (routeData.depMarker) map.removeLayer(routeData.depMarker);
                if (routeData.arrMarker) map.removeLayer(routeData.arrMarker);
            });
            activeRoutes.clear();

            const flightInfo = document.querySelector(".mobile-flight-menu");
            flightInfo.style = "transform: translate(-50%, 100%)";
        }
    });

    const aircrafts = Array.from(window.activePlanes.entries()).map(
        ([key, p]) => ({
            icao: key,
            lat: p.lat,
            lng: p.long,
            heading: p.deg || 0,
            type: p.aircraft_type,
            dep: p.dep,
            arr: p.arr,
        }),
    );

    aircraftLayer = new L.CanvasLayer(aircrafts);
    aircraftLayer.addTo(map);

    window.addEventListener("activePlanesUpdated", () => {
        const updatedAircrafts = Array.from(window.activePlanes.entries()).map(
            ([key, p]) => ({
                icao: key,
                lat: p.lat,
                lng: p.long,
                heading: p.deg || 0,
                type: p.aircraft_type,
                dep: p.dep,
                arr: p.arr,
            }),
        );
        if (aircraftLayer) {
            aircraftLayer.updateAircrafts(updatedAircrafts);
        }
    });
});