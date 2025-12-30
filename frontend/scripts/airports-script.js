const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../json/airports-collection.json');
const list = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log(`Vorher: ${list.length} Flughäfen`);

// Filtere Flughäfen: Behalte nur die mit IATA oder ICAO Code
const filtered = list.filter(airport => {
    return (airport.iata_code && airport.iata_code.trim() !== '') || 
           (airport.icao_code && airport.icao_code.trim() !== '');
});

console.log(`Nachher: ${filtered.length} Flughäfen`);
console.log(`Gelöscht: ${list.length - filtered.length} Flughäfen`);

// Speichere die gefilterte Liste
fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), 'utf8');
console.log('Datei wurde aktualisiert!');