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
const flightInfo = document.querySelector(".mobile-flight-menu");
const share = document.getElementById("share-flight");
const close = document.getElementById("close-panel");

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
        getUserPermission()
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
                    if (plane.length != 0) {
                        const icao = plane[0][0];
                        const searchPlane = plane[0][1];

                        searchPlane.isSelected = true;

                        const clicked = {
                            icao: icao,
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
                            searchPlane.icao = icao;
                            await handleSelectedPlane(searchPlane)
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
        if (window.innerWidth > 768) {
            controls.style.transform = "translateY(50%) !important";
        } else {
            controls.style.transform = "translateY(0%) !important";
        }
    });

    share.addEventListener("click", (_) => {
        const urlParams = new URLSearchParams(window.location.search);
        const icaoParam = urlParams.get("icao");
        shareFlight(icaoParam);
    });

    close.addEventListener("click", (_) => {
        flightInfo.style = "transform: translate(-50%, 100%)";
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
    });

    userRoute.addEventListener("click", (_) => {
        userRoute.classList.add("visible-route");
        searchSymbol.classList.remove("mag-glass");
    });

    routeButton.addEventListener("click", async (_) => {
        const start = startUser.value.trim();
        const end = endUser.value.trim();
        let planes;

        planes = Array.from(window.activePlanes.entries()).filter(
            ([key, p]) =>
                p.dep == start.toUpperCase() && p.arr == end.toUpperCase(),
        );
        console.log("Anzahl der Flüge: ", planes.length);

        if (planes.length == 0) {
            const possibleRoutes = await getCityAbbr(start, end);
            const possibleCityStart = possibleRoutes.possibleStarts;
            const possibleCityEnd = possibleRoutes.possibleFinishes;
            let variations = [];
            possibleCityStart.forEach((cs) => {
                possibleCityEnd.forEach((ce) => {
                    variations.push({ cityStart: cs, cityEnd: ce });
                });
            });

            planes = [];
            variations.forEach((v) => {
                const found = Array.from(window.activePlanes.entries()).filter(
                    ([key, p]) => p.dep == v.cityStart && p.arr == v.cityEnd,
                );
                planes.push(...found);
            });
        }
        if (planes.length == 1) {
            controls.style = "bottom: -100vh;";
            const icao = planes[0][0];
            const searchPlane = planes[0][1];

            searchPlane.isSelected = true;

            const clicked = {
                icao: icao,
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
                searchPlane.icao = icao;
                await handleSelectedPlane(searchPlane);
            })();
        } else if (planes.length > 1) {
            await handlePlane(planes, start, end);
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
});

let urlFlightHandled = false;

window.addEventListener("firstUpdate", (_) => {
    const urlParams = new URLSearchParams(window.location.search);
    const icaoParam = urlParams.get("icao");

    if (!icaoParam || urlFlightHandled) {
        return;
    }
});

window.addEventListener("activePlanesUpdated", (_) => {
    const urlParams = new URLSearchParams(window.location.search);
    const icaoParam = urlParams.get("icao");

    if (!icaoParam || urlFlightHandled) {
        return;
    }

    if (window.activePlanes.has(icaoParam)) {
        urlFlightHandled = true;
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
            searchPlane.icao = icaoParam;
            await handleSelectedPlane(searchPlane);
            // const start = await getAirport(searchPlane.dep);
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
    }
});

// Stelle Route neu dar, wenn ein Flugzeug ausgewählt ist und Updates ankommen
window.addEventListener("activePlanesUpdated", async (_) => {
    // Prüfe, ob ein Flugzeug aktuell ausgewählt ist
    if (!aircraftLayer || !aircraftLayer.selectedAircraft) {
        return;
    }

    const selectedIcao = aircraftLayer.selectedAircraft.icao;
    const updatedPlane = window.activePlanes.get(selectedIcao);

    if (updatedPlane && updatedPlane.isSelected) {
        // Aktualisiere die Position im selectedAircraft Objekt
        aircraftLayer.selectedAircraft.lat = updatedPlane.lat;
        aircraftLayer.selectedAircraft.lng = updatedPlane.long;
        aircraftLayer.selectedAircraft.heading = updatedPlane.deg || 0;

        // Redraw das Canvas, um die neue Position zu zeigen
        aircraftLayer._redraw();

        // ICAO zum Objekt hinzufügen bevor es übergeben wird
        updatedPlane.icao = selectedIcao;
        
        await handleSelectedPlane(updatedPlane)
    }
});
