function handleRouteProgress(
    dep_lat,
    dep_lng,
    planePos_lat,
    planePos_lng,
    arr_lat,
    arr_lng,
    routeId,
) {
    if (
        isNaN(dep_lat) || isNaN(dep_lng) ||
        isNaN(arr_lat) || isNaN(arr_lng) ||
        isNaN(planePos_lat) || isNaN(planePos_lng)
    ) {
        setError('Huch!', 'Flugroute konnte nicht berechnet werden.');
        return false;
    }

    controls.style = "top: 0;";

    activeRoutes.forEach((routeData) => {
        if (routeData.polylineStart) map.removeLayer(routeData.polylineStart);
        if (routeData.polylineEnde) map.removeLayer(routeData.polylineEnde);
        map.removeLayer(routeData.depMarker);
        map.removeLayer(routeData.arrMarker);
    });
    activeRoutes.clear();

    //? 1. Great Circle Route zwischen Start und Ziel

    let dep = [dep_lat, dep_lng];
    let arr = [arr_lat, arr_lng];
    let planePos = [planePos_lat, planePos_lng];

    const segmentToPlane = createGreatCircle(dep, planePos, 100);
    const segmentFromPlane = createGreatCircle(planePos, arr, 100);

    const polylineStart = L.polyline(segmentToPlane, {
        color: "orange",
        weight: 2,
        renderer: canvasRenderer,
        smoothFactor: 1.5,
    }).addTo(map);

    const polylineEnde = L.polyline(segmentFromPlane, {
        color: "grey",
        weight: 2,
        dashArray: "10, 10",
        dashOffset: "0",
        renderer: canvasRenderer,
        smoothFactor: 1.5,
    }).addTo(map);

    //? 2. Berechnen wo das Flugzeug auf der Route ist

    const flown = haversineDistanceKM(
        dep_lat,
        dep_lng,
        planePos_lat,
        planePos_lng,
    );
    const toFly = haversineDistanceKM(
        planePos_lat,
        planePos_lng,
        arr_lat,
        arr_lng,
    );
    const totalDistance = flown + toFly;
    const progress = flown / totalDistance;

    const { depMarker, arrMarker } = setAirports(
        dep_lat,
        dep_lng,
        arr_lat,
        arr_lng,
    );

    activeRoutes.set(routeId, {
        polylineStart,
        polylineEnde,
        depMarker,
        arrMarker,
    });

    return progress;
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

    const R = 6371; 
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a =
        sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1) * cos(lat2) * sin(dLon / 2) * sin(dLon / 2);
    const c = 2 * atan2(sqrt(a), sqrt(1 - a));
    const d = R * c;
    return d; 
}

function createCurve(dep, planePos, arr, steps) {
    const dist_dep_plane = haversineDistanceKM(
        dep[0],
        dep[1],
        planePos[0],
        planePos[1],
    );
    const dist_plane_arr = haversineDistanceKM(
        planePos[0],
        planePos[1],
        arr[0],
        arr[1],
    );
    const totalDist = dist_dep_plane + dist_plane_arr;

    const stepsToPlane = Math.round(steps * (dist_dep_plane / totalDist));
    const stepsToArr = steps - stepsToPlane;

    const segment1 = createGreatCircle(dep, planePos, stepsToPlane);
    const segment2 = createGreatCircle(planePos, arr, stepsToArr);

    return [...segment1, ...segment2.slice(1)];
}

function createGreatCircle(p1, p2, steps) {
    const curve = [];

    const lat1 = (p1[0] * Math.PI) / 180;
    const lon1 = (p1[1] * Math.PI) / 180;
    const lat2 = (p2[0] * Math.PI) / 180;
    const lon2 = (p2[1] * Math.PI) / 180;

    const d = Math.acos(
        Math.sin(lat1) * Math.sin(lat2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1),
    );

    if (d < 0.0001) {
        return [p1, p2];
    }

    for (let i = 0; i <= steps; i++) {
        const f = i / steps;

        const A = Math.sin((1 - f) * d) / Math.sin(d);
        const B = Math.sin(f * d) / Math.sin(d);

        const x =
            A * Math.cos(lat1) * Math.cos(lon1) +
            B * Math.cos(lat2) * Math.cos(lon2);
        const y =
            A * Math.cos(lat1) * Math.sin(lon1) +
            B * Math.cos(lat2) * Math.sin(lon2);
        const z = A * Math.sin(lat1) + B * Math.sin(lat2);

        const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
        const lon = Math.atan2(y, x);

        curve.push([(lat * 180) / Math.PI, (lon * 180) / Math.PI]);
    }

    return curve;
}