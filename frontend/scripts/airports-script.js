if (!window.activePlanes) {
    window.activePlanes = new Map();

    window.activePlanes.set("LH810", {
        aircraft_type: "AIRBUS A320 - 200",
        lat: 51.43,
        long: 3.21,
        dep: "FRA",
        arr: "JFK",
        deg: 300,
        isSelected: false
    });

    window.activePlanes.set("CA7289", {
        aircraft_type: "Boeing 777-200",
        lat: 54.15,
        long: -3.2,
        dep: "YVR",
        arr: "FCO",
        deg: 120,
        isSelected: false
    });
    
    // Transatlantik: London → New York (über Atlantik)
    window.activePlanes.set("BA177", {
        aircraft_type: "Boeing 777-300",
        lat: 52.5,
        long: -25.3,
        dep: "LHR",
        arr: "JFK",
        deg: 280,
        isSelected: false
    });

    // Europa: Frankfurt → Barcelona
    window.activePlanes.set("LH1130", {
        aircraft_type: "AIRBUS A320",
        lat: 41.562,
        long: 2.802,
        dep: "FRA",
        arr: "BCN",
        deg: 230,
        isSelected: false
    });

    // Langstrecke: Dubai → München (über Türkei)
    window.activePlanes.set("EK053", {
        aircraft_type: "AIRBUS A380",
        lat: 38.5,
        long: 32.8,
        dep: "DXB",
        arr: "MUC",
        deg: 320,
        isSelected: false
    });

    // Nordatlantik: New York → Frankfurt
    window.activePlanes.set("LH400", {
        aircraft_type: "Boeing 747-8",
        lat: 48.2,
        long: -38.5,
        dep: "EWR",
        arr: "FRA",
        deg: 65,
        isSelected: false
    });

    // Asien-Europa: Singapur → London (über Indien)
    window.activePlanes.set("SQ317", {
        aircraft_type: "AIRBUS A350-900",
        lat: 22.5,
        long: 78.3,
        dep: "SIN",
        arr: "LHR",
        deg: 315,
        isSelected: false
    });

    // Pazifik: Los Angeles → Tokio
    window.activePlanes.set("JL061", {
        aircraft_type: "Boeing 787-9 Dreamliner",
        lat: 42.5,
        long: -165.2,
        dep: "LAX",
        arr: "NRT",
        deg: 305,
        isSelected: false
    });

    // Kurzstrecke: Paris → Amsterdam
    window.activePlanes.set("AF1240", {
        aircraft_type: "AIRBUS A321neo",
        lat: 50.1,
        long: 3.5,
        dep: "CDG",
        arr: "AMS",
        deg: 25,
        isSelected: false
    });

    // Naher Osten: Doha → Rom
    window.activePlanes.set("QR115", {
        aircraft_type: "AIRBUS A330-900",
        lat: 35.8,
        long: 23.4,
        dep: "DOH",
        arr: "FCO",
        deg: 295,
        isSelected: false
    });

    // Australien → Singapur
    window.activePlanes.set("QF051", {
        aircraft_type: "AIRBUS A380",
        lat: -12.5,
        long: 125.8,
        dep: "SYD",
        arr: "SIN",
        deg: 315,
        isSelected: false
    });

    // Madrid → Buenos Aires (Südatlantik)
    window.activePlanes.set("IB6845", {
        aircraft_type: "AIRBUS A350-900",
        lat: -8.3,
        long: -28.5,
        dep: "MAD",
        arr: "EZE",
        deg: 225,
        isSelected: false
    });

    // Dubai → New York (über Atlantik)
    window.activePlanes.set("EK201", {
        aircraft_type: "AIRBUS A380",
        lat: 42.8,
        long: -45.2,
        dep: "DXB",
        arr: "JFK",
        deg: 285,
        isSelected: false
    });

    // Hong Kong → San Francisco (Transpazifik)
    window.activePlanes.set("CX872", {
        aircraft_type: "Boeing 777-300ER",
        lat: 38.5,
        long: -155.3,
        dep: "HKG",
        arr: "SFO",
        deg: 65,
        isSelected: false
    });

    // Berlin → Peking
    window.activePlanes.set("SU574", {
        aircraft_type: "AIRBUS A330-300",
        lat: 48.5,
        long: 95.2,
        dep: "BER",
        arr: "PEK",
        deg: 115,
        isSelected: false
    });

    // Johannesburg → London (über Afrika)
    window.activePlanes.set("BA056", {
        aircraft_type: "Airbus A380",
        lat: 12.5,
        long: 28.3,
        dep: "JNB",
        arr: "LHR",
        deg: 355,
        isSelected: false
    });

    // Istanbul → Bangkok
    window.activePlanes.set("TK70", {
        aircraft_type: "Boeing 777-300ER",
        lat: 28.8,
        long: 68.5,
        dep: "IST",
        arr: "BKK",
        deg: 95,
        isSelected: false
    });

    // Toronto → London
    window.activePlanes.set("AC858", {
        aircraft_type: "Boeing 787-9 Dreamliner",
        lat: 52.3,
        long: -42.8,
        dep: "YYZ",
        arr: "LHR",
        deg: 75,
        isSelected: false
    });

    // Toronto → London
    window.activePlanes.set("BA092", {
        aircraft_type: "Boeing 777-200ER",
        lat: 49.8,
        long: -35.5,
        dep: "YYZ",
        arr: "LHR",
        deg: 68,
        isSelected: false
    });

    // Toronto → London
    window.activePlanes.set("AC860", {
        aircraft_type: "AIRBUS A330-300",
        lat: 54.2,
        long: -50.2,
        dep: "YYZ",
        arr: "LHR",
        deg: 72,
        isSelected: false
    });

    // Toronto → London
    window.activePlanes.set("VS46", {
        aircraft_type: "AIRBUS A350-1000",
        lat: 51.5,
        long: -28.3,
        dep: "YYZ",
        arr: "LHR",
        deg: 80,
        isSelected: false
    });

    // Seoul → Los Angeles (Nordpazifik)
    window.activePlanes.set("KE017", {
        aircraft_type: "AIRBUS A380",
        lat: 52.8,
        long: -168.5,
        dep: "ICN",
        arr: "LAX",
        deg: 85,
        isSelected: false
    });

    // São Paulo → Frankfurt
    window.activePlanes.set("LH507", {
        aircraft_type: "Boeing 747-8",
        lat: 2.5,
        long: -18.3,
        dep: "GRU",
        arr: "FRA",
        deg: 45,
        isSelected: false
    });

    window.activePlanes.set("QTS1", {
        aircaft_type: "Boeing 787-10",
        lat: 8.1405,
        long: 95.712,
        dep: "LHR",
        arr: "SYD",
        deg: 320,
        isSelected: false
    })
}