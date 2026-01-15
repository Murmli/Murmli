# Murmli Project Documentation (GEMINI.md)

Diese Datei dient als zentrale Wissensbasis für die Entwicklung am Murmli-Projekt. Sie beschreibt Architektur, Standards und Mechaniken, um einen konsistenten Entwicklungsprozess zu gewährleisten.

## 1. Projektübersicht

Murmli ist eine integrierte Gesundheits- und Lifestyle-Anwendung, die Ernährung, Fitness und Alltagsplanung vereint. Kernmerkmale sind die intelligente Verknüpfung von Rezepten, Einkaufslisten, Trainingsplänen und Kalorientracking, unterstützt durch fortschrittliche LLM-Integrationen.

### Projektstruktur (Monorepo)

Das Projekt ist als Monorepo organisiert:
- **Root**: Enthält globale Konfigurationen und Scripts (`npm run install:all`, `npm run start`).
- **backend/**: Node.js/Express Applikation (API & Business Logic).
- **frontend/**: Vue.js 3 / Ionic / Vite Applikation (User Interface).

## 2. Technologie-Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Datenbank**: MongoDB (Mongoose ODM)
- **API**: RESTful V2
- **Validierung**: Eigene Validierungs-Utilities & JSON Schemas
- **LLM Integration**: Provider-agnostische Implementierung (OpenAI, Google, etc. via Dynamic Import)

### Frontend
- **Framework**: Vue.js 3 (Composition API)
- **UI Toolkit**: Ionic Framework
- **Build Tool**: Vite
- **State Management**: Pinia
- **Sprache**: JavaScript
- **Styling**: SCSS/CSS (Global + Scoped)
- **I18n**: vue-i18n (Source of Truth: `de-DE.json`)

## 3. Architektur & Mechaniken

### 3.1. LLM-Pipeline (Core Mechanic)

Die Interaktion mit Large Language Models ist zentralisiert und abstrahiert.

**Workflow:**
1.  **Controller**: Nimmt Anfrage entgegen (z.B. `recipeController.js`).
2.  **Util-Layer**: Ruft spezifische Funktion in `backend/utils/llm.js` auf (z.B. `createRecipe`).
3.  **Prompting**:
    *   System-Prompts und User-Prompts werden strikt getrennt in `backend/utils/prompts.js` verwaltet.
    *   Prompts sind Funktionen, die Kontext (z.B. Sprache, User-Präferenzen, existierende Daten) injizieren.
4.  **API Call Wrapper**: `apiCall` (in `llm.js` importiert aus Provider-Datei) handhabt den Request.
5.  **Schema Validation**: Fast alle LLM-Calls nutzen strikte JSON-Schemas (`backend/utils/schemas/*.schema.js`), um strukturierte Antworten zu erzwingen.
6.  **Response**: Validiere JSON wird an den Controller zurückgegeben.

**Wichtig**: Direkte API-Calls an LLM-Provider im Controller sind zu vermeiden. Immer über `llm.js` und `prompts.js` gehen.

### 3.2. Frontend Architektur

- **Stores (Pinia)**:
    -   `apiStore.js`: Handhabt Authentifizierung (Session Token), Base URL und globale Loading-States.
    -   `dialogStore.js`: Zentrales Management aller Modals/Dialoge (`openDialog`, `closeDialog`).
    -   `languageStore.js`: Verwaltet Lokalisierung.
-   **Autochat/Kommunikation**:
    -   API-Anfragen laufen über `apiStore.apiRequest`, welches Auth-Header (`Authorization`, `x-header-secret-key`) automatisch setzt.
-   **Components**: PascalCase, logische Trennung in `components/general`, `components/recipe` etc.

### 3.3. Authentifizierung

-   Session-basiert mit JWT (oder opaque Tokens).
-   Token wird im `localStorage` ("sessionToken") gespeichert.
-   Backend validiert Session via Middleware.
-   `apiStore.createSession()` initialisiert anonyme Sessions.

## 4. Code Styling & Konventionen

### Allgemein
-   **Sprache**: Code (Variablen, Funktionen, Kommentare) immer auf **Englisch**.
-   **Kommunikation mit User**: Immer auf **Deutsch**.
-   **Git Commit Messages**: Immer auf **Englisch** (Imperativ, z.B. "Add recipe translation feature").

### Backend
-   **Async/Await**: Durchgängig verwenden.
-   **Error Handling**: `try...catch` Blöcke in allen Controllern. Error-Responses folgen Standard-JSON `{ error: "Message" }`.
-   **Dateinamen**: camelCase (`recipeController.js`).
-   **Models**: PascalCase (`RecipeModel.js`).

### Frontend
-   **Vue Components**: `<script setup>` Syntax.
-   **Component Namen**: Multi-Word, PascalCase (z.B. `RecipeCard.vue`).
-   **CSS**: Scoped wo immer möglich. Nutzung von CSS-Variablen für Theme-Konsistenz.

## 5. Debugging & Starten

### Entwicklungsumgebung starten

```bash
# Im Root-Verzeichnis
npm run dev
```
Dies startet:
-   Backend auf port `8080`.
-   Frontend auf port `3000` (Proxy configured).

### Wichtige Dateien für Debugging
-   **Logs**: Server-Logs im Terminal beachten.
-   **LLM Issues**: Prüfen von `backend/utils/llm.js` und den zugehörigen Schemas bei Parsing-Fehlern.
-   **Environment**: `.env` im Backend muss korrekt gesetzt sein (`DB_STRING`, `LLM_PROVIDER`, API Keys).

## 6. Lokalisierung (i18n)

-   **Source**: `frontend/src/locales/de-DE.json` ist die Quelle der Wahrheit.
-   **Prozess**: Neue Strings immer zuerst in `de-DE.json` hinzufügen. Andere Sprachen werden davon abgeleitet (übersetzt).
-   **Keys**: Hierarchisch strukturiert (z.B. `recipe.ingredients.title`).

## 7. Agenten-Regeln (Zusätzlich zu AGENTS.md)

1.  **Analysiere zuerst**: Bevor Code geändert wird, verstehe die Abhängigkeiten (insb. bei LLM-Prompts).
2.  **Keine "Magic Strings"**: Prompts gehören in `prompts.js`, nicht in den Business-Logic-Code.
3.  **Schema Compliance**: Wenn du Output-Formate von LLMs änderst, musst du zwingend das zugehörige Schema in `backend/utils/schemas/` anpassen.
4.  **UI Konsistenz**: Nutze existierende UI-Komponenten (`AdminStats`, `ChatDialog` Patterns) statt neue zu erfinden, wo nicht nötig.

---
*Generated by Antigravity for Murmli Project Analysis.*