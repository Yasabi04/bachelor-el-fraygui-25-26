# Dokumentation

Die durchgeführten Tests in der ERGEBNISSE.MD belaufen sich lediglich auf den Faktor Zeit Kosten. Andere Ergebnisse und Auswerungen befinden sich im Wiki.

## Durchführung
Die Tests wurden auf einem lokalen Server sowie in einer Serverless-Umgebung durchgeführt. Dabei wurden mehrere Durchläufe vorgenommen, um aussagekräftige Durchschnittswerte zu erhalten.

## Messmethodik Server

Die Zeitmessung erfolgte im selben Netzwerk, sodass Übertragungsengpässe eliminiert werden können. Wenn sich ein Nutzer verbindet, startet im Backend der Fetch-Mechanismus. Unmittelbar vor jedem Fetch wird dem Response-Objekt ein Zeitstempel hinzugefügt.

Nach dem Empfang der Daten wird erneut ein Zeitstempel gesetzt. Die Differenz zwischen den beiden Zeitstempeln ergibt die benötigte Zeit für den Fetch-Vorgang. 

### Messmethodik AWS
Die Auführung der Messmethodik ist bei AWS identisch. Jedoch kann ein Response-Objekt, bestehend aus Zeitstempel und Flugdaten, nicht direkt an alle Nutzer versendet werden. Der Grund ist die Implementierung der SQS. Eine SQS hat immer einen maximalen Datendurchsatz von 128 MB, weshalb die Flugdaten in kleinere Pakete (engl. __Chunks__) aufgeteilt werden. Für die Flugzeuge über dem europäischen Luftraum müssen daher die Daten in 4 Pakete aufgeteilt werden. Die Weitergabe an verbundene Client wird dann nicht nur einmal, sondern viermal ausgeführt. 

Um auch bei der AWS Messung Übetragungsengpässe zu vermeiden, wurde ein Server (hier EC2-Instanz) von AWS hinzugezogen. Diese ist mit demselben Script wie das normale Frontend ausgestattet. Client (also die EC2-Instanz) und Server (die Anwendung) befinden sich demnach im selben Netzwerk. 