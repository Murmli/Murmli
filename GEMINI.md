# GEMINI.md - Murmli Project Context

Dieses Dokument dient als zentraler Kontext für die Arbeit mit der Murmli-Codebase. Es beschreibt die Architektur, Technologien und Konventionen des Projekts.

## Projektübersicht

Murmli ist eine ganzheitliche Plattform für Fitness und Ernährung. Sie kombiniert Einkaufslisten, Rezepte, Mahlzeitenplanung, Kalorientracking und Trainingsprogramme in einer einheitlichen Anwendung. Die App nutzt intensiv Large Language Models (LLMs) für automatisierte Workflows und intelligente Empfehlungen.

### Kern-Technologien

- **Monorepo:** Verwaltet Backend und Frontend in einem Repository.
- **Backend:** Node.js mit Express, MongoDB (Mongoose) als Datenbank.
- **Frontend:** Vue 3 mit Vuetify 3, Vite als Build-Tool, Pinia für State Management.
- **Mobile:** Capacitor für die Bereitstellung als Android- und iOS-App.
- **KI/LLM:** Integration von OpenAI, Google Gemini, DeepSeek und OpenRouter. Unterstützt Text-, Bild- und Audio-Eingaben (Multimodal).
- **Testing:** Playwright für End-to-End-Tests, Jest für Unit-Tests im Backend.

---

## Architektur & Struktur

### Backend (`/backend`)
Folgt dem Controller-Route-Model-Pattern:
- **`controllers/`**: Enthält die Geschäftslogik für die verschiedenen Module (Rezepte, Training, Shopping, etc.).
- **`routes/`**: Definiert die API-Endpunkte (v2 Präfix: `/api/v2/...`).
- **`models/`**: Mongoose-Schemata für die MongoDB-Datenstrukturen.
- **`utils/`**: Hilfsfunktionen, insbesondere:
    - **`llm.js`**: Zentraler Hub für alle KI-Anfragen. Abstrahiert die Provider (OpenAI, Google, etc.).
    - **`agents/`**: Spezialisierte KI-Agenten für komplexe Aufgaben wie Rezeptanalyse oder Trainingsplanerstellung.
    - **`schemas/`**: JSON-Schemata für strukturierte LLM-Antworten.

### Frontend (`/frontend`)
- **`src/pages/`**: Vue-Komponenten für die verschiedenen Ansichten.
- **`src/stores/`**: Pinia-Stores für die globale Statusverwaltung (Auth, Planner, User, etc.).
- **`src/plugins/`**: Konfiguration für Vuetify, Router und andere Integrationen.
- **`android/` & `ios/`**: Native Projekte für Capacitor.

---

## Entwicklungsworkflow

### Installation
Im Wurzelverzeichnis ausführen:
```powershell
npm run install:all
```

### Starten der Entwicklungsumgebung
Backend (Watch-Mode) und Frontend parallel starten:
```powershell
npm run dev
```
- **Backend:** http://localhost:8080 (API-Docs unter `/api-docs`)
- **Frontend:** http://localhost:3000

### Bauen für Produktion
```powershell
npm run build
```

### Mobile Development (Android)
```powershell
cd frontend
npm run apprun
```

---

## Konventionen & Richtlinien

- **Mobile-First (Exklusiv):** Da Murmli primär als mobile App (Capacitor) genutzt wird, muss das Frontend **ausnahmslos für mobile Endgeräte optimiert** sein. UI-Komponenten müssen auf kleinen Bildschirmen gut lesbar, touch-freundlich und performant sein. Desktop-Optimierungen sind zweitrangig.
- **Sprache:** Code und Kommentare sind auf Englisch. Die Benutzeroberfläche unterstützt Mehrsprachigkeit (Locales in `frontend/src/locales`).
- **Sicherheit:** 
    - Secrets gehören in `.env`-Dateien (siehe `README.md` für erforderliche Variablen).
    - API-Anfragen erfordern oft einen `X-Header-Secret-Key` zusätzlich zur JWT-Authentifizierung.
- **KI-Interaktion:** Neue KI-Features sollten über `backend/utils/llm.js` implementiert werden, um die Provider-Abstraktion beizubehalten. Strukturierte Antworten (JSON) sind bevorzugt.
- **Build & Sync bei Frontend-Änderungen:** Nach jeder Änderung im `frontend`-Verzeichnis **muss** zwingend ein Build und ein Capacitor-Sync durchgeführt werden, damit die Änderungen im Android Studio / Emulator sichtbar werden:
    1. `npm run build` (im Wurzelverzeichnis oder im `frontend` Ordner)
    2. `npx cap copy` oder `npx cap sync` (im `frontend` Ordner)
    Dies stellt sicher, dass die kompilierten Web-Assets in die nativen Android/iOS-Ordner übertragen werden.
- **Versionsanpassung (Store-Releases):** Nach jeder Änderung müssen die Versionen für die Stores angepasst werden (Inkrement um **+0.001**):
    - **iOS:** In `frontend/ios/App/App.xcodeproj/project.pbxproj` den Wert `MARKETING_VERSION` anpassen.
    - **Android:** In `frontend/android/app/build.gradle` den Wert `versionName` anpassen.
- **Testing:** Bei Änderungen am Backend sollten bestehende Jest-Tests (`backend/tests`) ausgeführt werden. E2E-Tests befinden sich im Wurzelverzeichnis unter `tests/e2e`.

---

## Wichtige Befehle (Zusammenfassung)

| Befehl | Beschreibung |
| :--- | :--- |
| `npm run install:all` | Installiert alle Abhängigkeiten im gesamten Monorepo. |
| `npm run dev` | Startet Backend (nodemon) und Frontend (vite) im Dev-Modus. |
| `npm run test:e2e` | Führt die Playwright E2E-Tests aus. |
| `cd backend && npm test` | Führt Backend-Unit-Tests (Jest) aus. |
| `cd frontend && npm run build` | Erstellt den Produktions-Build des Frontends. |

---

## Internationalisierung (i18n) & Lokalisierung

- **Architektur:** Die App nutzt ein dynamisches Lokalisierungssystem. Der `languageStore` (Pinia) verwaltet die aktuelle Sprache (`locale`) und lädt die entsprechenden Übersetzungsdateien asynchron aus `frontend/src/locales/`.
- **Referenzsprache:** Die Datei `de-DE.json` ist die **Referenzquelle**. Neue Texte müssen immer zuerst hier hinzugefügt werden.
- **Automatisierte Übersetzung:** Mit dem Befehl `npm run buildLang` (ausgeführt im Frontend) wird das Script `scripts/buildLang.js` gestartet. Dieses Script vergleicht die Referenzdatei (`de-DE.json`) mit allen anderen Sprachen, identifiziert fehlende Schlüssel und übersetzt diese automatisch mithilfe der OpenAI API (GPT).
- **Verwendung im Code:** Übersetzungen werden im Frontend über die Funktion `languageStore.t('pfad.zum.key')` abgerufen. Diese Funktion unterstützt verschachtelte Schlüssel und ersetzt Zeilenumbrüche (`\n`) automatisch durch HTML-Linebreaks (`<br />`). Es sollte niemals Text direkt ("hartkodiert") in Komponenten geschrieben werden.
- **Persistenz:** Die vom Nutzer gewählte Sprache wird im `localStorage` unter `appLocale` gespeichert und beim App-Start automatisch geladen.

---
