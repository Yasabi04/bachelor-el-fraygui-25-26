const centerSymbol = document.getElementById("center");
const searchSymbol = document.getElementById("search");
const userInput = document.getElementById("input");

function getUserPermission() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            map.flyTo([latitude, longitude], 11);
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
                    if (plane) {
                        const lat = plane[0][1].lat
                        const lng = plane[0][1].long
                        map.flyTo([lat, lng], 7);

                        // isSelected hinzufügen
                    }
                }
            }
        });
    });
});
