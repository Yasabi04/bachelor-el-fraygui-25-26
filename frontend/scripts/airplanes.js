async function handlePlane(planes, start = "", end = "") {
    if (planes.length == 0) {
    } else if (planes.length == 1) {
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

        handleSelectedPlane(clicked);
    } else if (planes.length > 1) {
        controls.style = "bottom: -100vh;";

        flight_list.innerHTML = "";
        planes.forEach((flight) => {
            console.log(flight[0]);
            const route = document.querySelector(".route-found-flights");
            route.innerHTML = `${start.toUpperCase()} → ${end.toUpperCase()}`;
            const singleFlight = document.createElement("li");
            singleFlight.classList.add("flight-li");
            singleFlight.innerHTML = `
                    <span class="flight-icao">${flight[0]}</span>
                `;

            singleFlight.addEventListener("click", () => {
                const icao = flight[0];
                const searchPlane = flight[1];

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

                handleSelectedPlane(clicked);

                flight_list_container.style.transform = "translate(-50%, 100%)";
            });

            flight_list.appendChild(singleFlight);
        });
        flight_list_container.style.transform = "translate(-50%, 0%)";
    }
}

async function handleSelectedPlane(plane) {
    const planeLng = plane.lng || plane.long;

    const start = await getAirport(plane.dep);
    const end = await getAirport(plane.arr);

    if (start && end) {
        const progress = handleRouteProgress(
            start.lat,
            start.lng,
            plane.lat,
            planeLng,
            end.lat,
            end.lng,
            plane.icao,
        );

        if (progress !== false) {
            updateInfo(
                plane.icao,
                plane.aircraft_type || plane.type,
                plane.dep,
                plane.arr,
                progress,
            );
        }
    }
    else {
        setError('Huch!', 'Fluginformationen konnten nicht ausgelesen werden.');
    }
}
