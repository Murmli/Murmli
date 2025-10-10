# Express.js MongoDB API

Dies ist eine einfache Express.js-Anwendung mit MongoDB als Datenbank für eine RESTful API.

## Installation

Bevor du beginnst, stelle sicher, dass du Node.js und npm auf deinem System installiert hast.

1. **Clone das Repository:**

   ```bash
   git clone https://github.com/Murmli/Backend-Node.git
   ```

2. **Wechsle in das Projektverzeichnis:**

   ```bash
   cd Backend-Node
   ```

3. **Installiere die Abhängigkeiten:**

   ```bash
   npm install
   ```

## Konfiguration

Bevor du die Anwendung ausführst, musst du die Umgebungsvariablen konfigurieren. Erstelle eine `.env`-Datei im Stammverzeichnis des Projekts.
Verwende die [.env.example](https://github.com/Murmli/Backend-Node/blob/main/.env.example) dazu und trage deinen Daten ein. Dort kannst du auch die Anzahl der Rezeptvorschläge pro Anfrage mit `RECIPE_SUGGESTIONS_PER_REQUEST` festlegen.

## Ausführen

Nachdem du die Anwendung konfiguriert hast, kannst du sie mit dem folgenden Befehl starten:

```bash
npm start
```

Die Anwendung wird standardmäßig auf dem in der Umgebungsvariable `PORT` konfigurierten Port gestartet (standardmäßig 3000).

## Verwendung

Sende den `x-header-secret-key` immer mit, mit dem Wert deiner SECRET_KEY aus deinen Umgebungsvariablen.

Sobald die Anwendung läuft, kannst du auf die API-Routen zugreifen.

Die interaktive API-Dokumentation (Swagger UI) erreichst du unter:

```
http://localhost:<PORT>/api-docs
```

(Standard-Port ist 8080, kann aber in deiner `.env`-Datei angepasst werden.)

Eine zusätzliche, ältere Dokumentation befindet sich im Ordner [docs](https://github.com/Murmli/Backend-Node/tree/main/docs).
