# Vergleich einer Server-basierten und serverlosen Architektur anhand von Echtzeit-Flugdaten
## Projektübersicht

Im Rahmen dieser Bachelorarbeit wird ein Backendvergleich mithilfe von Echtzeit-Flugdaten angestrebt. Ziel ist es, ein serverloses Backend (AWS) mit einem lokal betriebenen Node.js-Server hinsichtlich Architektur, Wartbarkeit, Skalierbarkeit, Kosten und technischer Komplexität zu vergleichen.
Als Anwendungsfall dient eine Applikation, die in regelmäßigen Intervallen aktuelle Flugdaten von einer externen API bezieht und diese in Echtzeit an verbundene Clients weiterleitet.

## Features der Anwendung

* Live-Flugverkehr mit Fluginformationen (Start, Ziel, Flugzeugtyp, etc...)
* Filertung nach ICAO-Code und Flugstrecke
* Europa-weite Abgrenzung

## Installation

1. Projekt klonen
2. `cd ./backend`
3. `npm install`

### Starten der Serveranwendung

1. `cd ./backend`
2. .env-Datei erstellen mit AIRLABS_KEY, DATABASE_URL, POLLING_ID (beliebiger Wert), DB_PW und DB_NAME
3. (Wenn anderer DB-Anbieter als Prisma: `cd adapters/database` und `prisma.js` neu konfigurieren)
4. `cd ./server/`
5. `node server.js`
6. Anwendung im Browser öffnen

### Starten der AWS-Anwendung

1. `cd ./backend/terraform`
2. `terraform plan` (Zeigt geplante Code-Änderungen an) und mit `yes` bestätigen
3. `terraform apply` (Alle Änderungen hochladen und Websocket-URL aus Konsole kopieren)
4. AIRLABS_API am besten in der GUI von AWS selbst setzen (`fetchFlights`)
5. `cd ../frontend/scripts`
6. In `main.js` `awsUrl` mit WebsocketUrl ersetzen
7. Anwendung im Browser öffnen 

Contributors:
* Student: [Yassin El Fraygui](github.com/Yasabi04/)
* Prüfer: [Prof. Dr. Hoai Viet Nguyen](https://github.com/hvnguyen86)
