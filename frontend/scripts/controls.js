const centerSymbol = document.getElementById("center");
const searchSymbol = document.getElementById("search");
const userInput = document.getElementById("input");
const userRoute = document.getElementById("route");
const routeDiv = document.querySelector(".route");
const startUser = document.getElementById("start-user");
const endUser = document.getElementById("end-user");
const routeButton = document.getElementById("routeButton");
const flight_list = document.querySelector(".flights-ul");
const flight_list_container = document.querySelector(".flight-list");
const mapButton = document.getElementById("mapButton");
const errorMessage = document.querySelector(".error-container");
const error_heading = document.querySelector(".error-heading");
const error_message = document.querySelector(".error-message");
const controls = document.querySelector(".controls");
console.log("---------", controls);

const userIcon = L.icon({
    iconUrl: "./img/user-position.svg",
    iconSize: [16, 16],
    iconAnchor: [0, 0],
});

function getUserPermission() {
    const savedPosition = JSON.parse(
        "[" + localStorage.getItem("userPosition") + "]",
    );
    if (savedPosition) {
        map.flyTo(savedPosition, 10);
        L.marker([latitude, longitude], { icon: userIcon }).addTo(map);
        return;
    }
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            map.flyTo([latitude, longitude], 10);
            L.marker([latitude, longitude], { icon: userIcon }).addTo(map);
            const userPosition = [latitude, longitude];
            localStorage.setItem("userPosition", JSON.stringify(userPosition));
        });
    } else {
        setError(
            "Positionsbestimmung fehlgeschlagen",
            "Dieses Feature ist ohne Gerätestandort nicht verfügbar!",
        );
    }
}

function setError(title, message) {
    error_heading.innerHTML = title;
    error_message.innerHTML = message;

    errorMessage.style = "top: var(--size-s)";
}

async function shareFlight(icao) {
    const shareData = {
        url: `${window.location.href}`,
        title: "aurora_",
        text: `Ich habe folgenden Flug gefunden:\n${icao}\nSchau dir diesen Flug an!\n\n`,
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            const fallbackText = `${shareData.text} ${shareData.url}`;
            navigator.clipboard.writeText(fallbackText);
            alert("Text kopiert (Browser unterstützt kein direktes Teilen)");
        }
    } catch (err) {
        setError("Fehler beim Teilen.", err);
    }
}

document.addEventListener("DOMContentLoaded", (_) => {
    centerSymbol.addEventListener("click", (_) => {
        console.log("Center clicked");
        const urlParams = new URLSearchParams(window.location.search);
        const icaoParam = urlParams.get("icao");
        shareFlight(icaoParam);
    });

    searchSymbol.addEventListener("click", (_) => {
        searchSymbol.classList.add("mag-glass");
        userRoute.classList.remove("visible-route");
        userInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                const icaoCode = userInput.value.trim();
                if (icaoCode != "") {
                    searchSymbol.classList.remove("mag-glass");
                    const plane = Array.from(
                        window.activePlanes.entries(),
                    ).filter(([key, p]) => key == icaoCode);
                    console.log(plane);
                    if (plane.length != 0) {
                        const icao = plane[0][0];
                        const searchPlane = plane[0][1];

                        // Setze isSelected im activePlanes Objekt
                        searchPlane.isSelected = true;

                        // Erstelle clicked Objekt für setSelected
                        const clicked = {
                            icao: icao,
                            lat: searchPlane.lat,
                            lng: searchPlane.long,
                            heading: searchPlane.deg || 0,
                            type: searchPlane.aircraft_type,
                            dep: searchPlane.dep,
                            arr: searchPlane.arr,
                        };

                        // Setze als ausgewählt im Layer
                        if (aircraftLayer) {
                            aircraftLayer.setSelected(clicked);
                        }

                        // Zeichne Route und berechne Progress (async)
                        (async () => {
                            const start = await getAirport(searchPlane.dep);
                            const end = await getAirport(searchPlane.arr);
                            const progress = handleRouteProgress(
                                start.lat,
                                start.lng,
                                searchPlane.lat,
                                searchPlane.long,
                                end.lat,
                                end.lng,
                            );
                            updateInfo(
                                icao,
                                searchPlane.aircraft_type,
                                searchPlane.dep,
                                searchPlane.arr,
                                progress,
                            );
                        })();
                    } else {
                        setError(
                            "ICAO Code nicht vergeben!",
                            "Es konnte kein Flugzeug mit dieser Registrierung gefunden werden!",
                        );
                    }
                }
            }
        });
    });

    //! Hier wird alles reseted
    map.on("click", (_) => {
        searchSymbol.classList.remove("mag-glass");
        userRoute.classList.remove("visible-route");
        flight_list_container.style.transform = "translate(-50%, 100%)";
        errorMessage.style = "top: -100vh";
        controls.style = "transform: translateY(0%);";
    });

    userRoute.addEventListener("click", (_) => {
        userRoute.classList.add("visible-route");
        searchSymbol.classList.remove("mag-glass");
    });

    routeButton.addEventListener("click", (_) => {
        const start = startUser.value.trim();
        const end = endUser.value.trim();
        console.log(start, end);
        let planes;

        if (start.length === 3 && end.length === 3) {
            planes = Array.from(window.activePlanes.entries()).filter(
                ([key, p]) =>
                    p.dep == start.toUpperCase() && p.arr == end.toUpperCase(),
            );
        }

        if (planes.length == 1) {
            controls.style = "bottom: -100vh;";
            const icao = planes[0][0];
            const searchPlane = planes[0][1];

            // Setze isSelected im activePlanes Objekt
            searchPlane.isSelected = true;

            // Erstelle clicked Objekt für setSelected
            const clicked = {
                icao: icao,
                lat: searchPlane.lat,
                lng: searchPlane.long,
                heading: searchPlane.deg || 0,
                type: searchPlane.aircraft_type,
                dep: searchPlane.dep,
                arr: searchPlane.arr,
            };

            // Setze als ausgewählt im Layer
            if (aircraftLayer) {
                aircraftLayer.setSelected(clicked);
            }

            (async () => {
                const start = await getAirport(searchPlane.dep);
                const end = await getAirport(searchPlane.arr);
                const progress = handleRouteProgress(
                    start.lat,
                    start.lng,
                    searchPlane.lat,
                    searchPlane.long,
                    end.lat,
                    end.lng,
                );
                updateInfo(
                    icao,
                    searchPlane.aircraft_type,
                    searchPlane.dep,
                    searchPlane.arr,
                    progress,
                );
            })();
        } else if (planes.length > 1) {
            // TODO
            // console.log(planes);
            controls.style = "bottom: -100vh;";

            flight_list.innerHTML = ""; // Liste leeren
            planes.forEach((flight) => {
                console.log(flight[0]);
                const route = document.querySelector(".route-found-flights");
                route.innerHTML = `${start.toUpperCase()} → ${end.toUpperCase()}`;
                const singleFlight = document.createElement("li");
                singleFlight.classList.add("flight-li");
                singleFlight.innerHTML = `
                    <span class="flight-icao">${flight[0]}</span>
                `;

                // Event Listener für jeden Flug
                singleFlight.addEventListener("click", () => {
                    const icao = flight[0];
                    const searchPlane = flight[1];

                    // Setze isSelected im activePlanes Objekt
                    searchPlane.isSelected = true;

                    // Erstelle clicked Objekt für setSelected
                    const clicked = {
                        icao: icao,
                        lat: searchPlane.lat,
                        lng: searchPlane.long,
                        heading: searchPlane.deg || 0,
                        type: searchPlane.aircraft_type,
                        dep: searchPlane.dep,
                        arr: searchPlane.arr,
                    };

                    // Setze als ausgewählt im Layer
                    if (aircraftLayer) {
                        aircraftLayer.setSelected(clicked);
                    }

                    // Zeichne Route und berechne Progress (async)
                    (async () => {
                        const start = await getAirport(searchPlane.dep);
                        const end = await getAirport(searchPlane.arr);
                        const progress = handleRouteProgress(
                            start.lat,
                            start.lng,
                            searchPlane.lat,
                            searchPlane.long,
                            end.lat,
                            end.lng,
                        );
                        updateInfo(
                            icao,
                            searchPlane.aircraft_type,
                            searchPlane.dep,
                            searchPlane.arr,
                            progress,
                        );
                    })();

                    // Schließe die Flugliste
                    flight_list_container.style.transform =
                        "translate(-50%, 100%)";
                });

                flight_list.appendChild(singleFlight);
            });
            flight_list_container.style.transform = "translate(-50%, 0%)";
        } else {
            setError(
                "Keine Flüge gefunden!",
                "Diese Route wird anscheinend nicht direkt geflogen.",
            );
        }
        userRoute.classList.remove("visible-route");
    });

    let detail = true;
    mapButton.addEventListener("click", (_) => {
        if (detail == true) {
            tileLayer.setUrl(
                "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
            );
            detail = false;
        } else {
            tileLayer.setUrl(
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            );
            detail = true;
        }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const icaoParam = urlParams.get("icao");

    if (icaoParam && window.activePlanes.has(icaoParam)) {
        controls.style = "bottom: -100vh;";

        const searchPlane = window.activePlanes.get(icaoParam);
        searchPlane.isSelected = true;

        const clicked = {
            icao: icaoParam,
            lat: searchPlane.lat,
            lng: searchPlane.long,
            heading: searchPlane.deg || 0,
            type: searchPlane.aircraft_type,
            dep: searchPlane.dep,
            arr: searchPlane.arr,
        };

        if (aircraftLayer) {
            aircraftLayer.setSelected(clicked);
        }

        (async () => {
            const start = await getAirport(searchPlane.dep);
            const end = await getAirport(searchPlane.arr);
            const progress = handleRouteProgress(
                start.lat,
                start.lng,
                searchPlane.lat,
                searchPlane.long,
                end.lat,
                end.lng,
            );
            updateInfo(
                icaoParam,
                searchPlane.aircraft_type,
                searchPlane.dep,
                searchPlane.arr,
                progress,
            );
        })();
    } else if (icaoParam == null) {
        return;
    } else {
        setError(
            `Flugzeug nicht gefunden!`,
            `Die Flugregistrierung ${icaoParam} existiert nicht oder das Flugzeug ist außerhalb des Erfassungsbereiches.`,
        );
    }
});
