const centerSymbol = document.getElementById("center");
const searchSymbol = document.getElementById("search");
const userInput = document.getElementById("input");

const userIcon = L.icon({
    iconUrl: "./img/user-position.svg",
    iconSize: [16, 16],
    iconAnchor: [0, 0]
});

function getUserPermission() {

    
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            map.flyTo([latitude, longitude], 10);
            L.marker([latitude, longitude], { icon: userIcon }).addTo(map);
        });
    } else {
        alert("Feature ohne Gerätestandort nicht verfügbar!");
    }
}

document.addEventListener("DOMContentLoaded", (_) => {
    centerSymbol.addEventListener("click", (_) => {
        getUserPermission();
    });

    searchSymbol.addEventListener("click", (_) => {
        searchSymbol.classList.add("mag-glass");
        userInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                const icaoCode = userInput.value.trim();
                if (icaoCode != "") {
                    searchSymbol.classList.remove("mag-glass");
                    const plane = Array.from(window.activePlanes.entries()).filter(
                        ([key, p]) => (key == icaoCode)
                    );
                    console.log(plane)
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
                            arr: searchPlane.arr
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
                                end.lng
                            );
                            updateInfo(icao, searchPlane.aircraft_type, searchPlane.dep, searchPlane.arr, progress);
                        })();
                    }
                    else {
                        alert('Kein Flugzeug mit dieser Registrierung gefunden!')
                    }
                }
            }
        });
    });
});
