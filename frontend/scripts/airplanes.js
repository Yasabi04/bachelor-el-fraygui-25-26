async function handlePlane(planes, start = '', end = '') {
    if (planes.length == 0) {
    } else if (planes.length == 1) {
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

                    flight_list_container.style.transform =
                        "translate(-50%, 100%)";
                });

                flight_list.appendChild(singleFlight);
            });
            flight_list_container.style.transform = "translate(-50%, 0%)";
    }
}

async function handleSelectedPlane(plane) {
    // Panel sofort anzeigen
    const flightInfo = document.querySelector(".mobile-flight-menu");
    flightInfo.style = "transform: translate(-50%, 0%)";
    
    // Handle both 'lng' and 'long' property names
    const planeLng = plane.lng || plane.long;
    
    const start = await getAirport(plane.dep);
    const end = await getAirport(plane.arr);
    
    const progress = handleRouteProgress(
        start.lat,
        start.lng,
        plane.lat,
        planeLng,
        end.lat,
        end.lng,
        plane.icao,
    );

    updateInfo(
        plane.icao,
        plane.aircraft_type || plane.type,
        plane.dep,
        plane.arr,
        progress,
    );
}
