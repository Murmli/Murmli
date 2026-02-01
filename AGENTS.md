# AGENTS.md - Murmli Project Guidelines for AI Agents

Diese Datei enthält alle wichtigen Informationen für KI-Agenten, die am Murmli-Projekt arbeiten.

## 1. Projektübersicht

**Murmli** ist eine integrierte Fitness- und Lifestyle-App, die Einkaufslisten, Rezepte, Wochenpläne, Kalorientracking und Trainingspläne in einer einheitlichen Plattform vereint. Das Projekt nutzt fortschrittliche LLM-Integrationen für intelligente Features.

### Repository
- **URL**: https://github.com/Murmli/Murmli.git
- **Struktur**: Monorepo mit Workspaces (backend, frontend)
- **Version**: 1.0.0

## 2. Technologie-Stack

### Backend (backend/)
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.19+
- **Datenbank**: MongoDB mit Mongoose ODM 8.4+
- **API**: RESTful API V2
- **Authentifizierung**: JWT + Session-Token
- **LLM Integration**: Provider-agnostisch (OpenAI, Google, DeepSeek, OpenRouter)
- **Tests**: Jest 29.7+

### Frontend (frontend/)
- **Framework**: Vue.js 3 (Composition API)
- **UI Framework**: Ionic Framework
- **Build Tool**: Vite 5.3+
- **State Management**: Pinia 2.1+
- **Styling**: SCSS/CSS (Global + Scoped)
- **Internationalisierung**: vue-i18n (Quelle: de-DE.json)
- **Mobile**: Capacitor 7.0+ (iOS & Android)
- **Icons**: Material Design Icons (MDI)

## 3. Architektur

### Monorepo Struktur
```
Murmli/
├── backend/           # Node.js/Express API
│   ├── controllers/   # Route-Handler
│   ├── models/        # Mongoose Schemas
│   ├── routes/        # API Routes
│   ├── utils/         # Utilities & LLM Integration
│   └── tests/         # Jest Tests
├── frontend/          # Vue.js/Ionic App
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── stores/    # Pinia Stores
│   │   ├── locales/   # I18n Dateien
│   │   └── utils/
│   └── media/         # Store-Screenshots
├── .github/           # GitHub Actions
├── tests/             # Playwright E2E Tests
└── package.json       # Root-Workspace Konfiguration
```

### LLM-Pipeline (Core Mechanic)

Alle LLM-Interaktionen laufen durch einen zentralisierten Workflow:

1. **Controller** empfängt Anfrage (z.B. `recipeController.js`)
2. **Utils** ruft spezifische Funktion in `backend/utils/llm.js` auf
3. **Prompting**: System- und User-Prompts in `backend/utils/prompts.js`
4. **API Call**: `apiCall`-Wrapper aus Provider-Datei
5. **Schema Validation**: JSON-Schemas in `backend/utils/schemas/`
6. **Response**: Validiertes JSON zurück an Controller

**WICHTIG**: Keine direkten API-Calls zu LLM-Providern in Controllern!

### Frontend Architektur

- **apiStore.js**: Authentifizierung, Base URL, Loading-States
- **dialogStore.js**: Zentrales Modal/Dialog Management
- **languageStore.js**: Lokalisierung
- **API Requests**: Über `apiStore.apiRequest` mit automatischen Auth-Headers

## 4. Code Konventionen

### Sprachregeln
- **Code** (Variablen, Funktionen, Kommentare): **Englisch**
- **User-Kommunikation**: **Deutsch**
- **Git Commit Messages**: **Englisch** (Imperativ: "Add feature", "Fix bug")

### Backend
- **Async/Await**: Durchgängig verwenden
- **Error Handling**: `try...catch` in allen Controllern
- **Dateinamen**: camelCase (`recipeController.js`)
- **Models**: PascalCase (`RecipeModel.js`)
- **Utils**: camelCase (`llmUtils.js`)

### Frontend
- **Vue Components**: `<script setup>` Syntax
- **Component Namen**: Multi-Word, PascalCase (`RecipeCard.vue`)
- **Stores**: camelCase (`recipeStore.js`)
- **CSS**: Scoped wo möglich, CSS-Variablen für Theme-Konsistenz
- **File Organization**: Features in Unterordnern (`components/recipe/`, `components/training/`)

## 5. Entwicklungsworkflow

### Installation
```bash
# Alle Dependencies installieren
npm run install:all

# Nur Backend
npm run install:backend

# Nur Frontend
npm run install:frontend
```

### Entwicklungsstart
```bash
# Backend (Port 8080) + Frontend (Port 3000)
npm start

# Backend in Watch-Mode + Frontend
npm run dev

# Nur Backend
npm run dev:backend

# Nur Frontend
npm run start:frontend
```

### Wichtige Scripts
- `npm run build`: Produktions-Build Frontend
- `npm run test:e2e`: Playwright End-to-End Tests
- `npm run lint`: ESLint Frontend

## 6. Environment Variablen

### Backend (`backend/.env`)
```ini
# Datenbank
DB_STRING=mongodb://...
PORT=8080
HOST=localhost
APP_URL=http://localhost:8080

# Sicherheit
JWT_SECRET=...
SECRET_KEY=...
DEBUG=false

# LLM Provider
LLM_PROVIDER=openrouter|google|openai|deepseek
LLM_CACHE_MAX_AGE_DAYS=30

# OpenRouter
OPENROUTER_API_KEY=...
OPENROUTER_LOW_MODEL=...
OPENROUTER_HIGH_MODEL=...
OPENROUTER_RECIPE_IMAGE_MODEL=google/gemini-2.5-flash-image

# Google
GOOGLE_API_KEY=...
GOOGLE_LOW_MODEL=...
GOOGLE_HIGH_MODEL=...

# OpenAI
OPENAI_API_KEY=...
OPENAI_LOW_MODEL=...
OPENAI_HIGH_MODEL=...
OPENAI_TRANSCRIBE_MODEL=...

# DeepSeek
DEEPSEEK_API_KEY=...
DEEPSEEK_LOW_MODEL=...
DEEPSEEK_HIGH_MODEL=...

# Features
RECIPE_SUGGESTIONS_PER_REQUEST=3
RECIPE_IMAGE_ASPECT_RATIO=3:2

# Azure Storage (Bilder)
AZURE_STORAGE_CONTAINER_NAME=...
AZURE_STORAGE_CONNECTION_STRING=...
AZURE_STORAGE_URL=...

# Email
GMAIL_SMTP_USER=...
GMAIL_SMTP_PASSWORD=...
```

### Frontend (`frontend/.env` / `frontend/.env.production`)
```ini
VITE_API_BASE_URL=http://localhost:8080/api/v2
VITE_BACKEND_BASE_URL=http://localhost:8080
VITE_HEADER_SECRET_KEY=...
VITE_MIN_RECIPE_SUGGESTIONS=3
VITE_RECIPE_FETCH_COUNT=10

# Für Locale-Generierung
OPENAI_API_KEY=...
OPENAI_TRANSLATION_MODEL=gpt-4
```

## 7. Testing

### Backend Tests (Jest)
```bash
cd backend
npm test
```

**Test-Dateien**:
- `backend/tests/visitorTracking.test.js`
- `backend/tests/trainingWorkflow.test.js`
- `backend/tests/shoppingListUtils.test.js`
- `backend/tests/shoppingListController.test.js`
- `backend/tests/exerciseImageUtils.test.js`

### E2E Tests (Playwright)
```bash
npm run test:e2e
```

Konfiguration in `playwright.config.ts`

## 8. Wichtige Patterns & Regeln

### LLM Integration
1. **Prompts in `prompts.js`**: Keine Magic Strings in Business-Logic
2. **Schema Compliance**: Bei Änderungen am LLM-Output auch Schema anpassen
3. **Provider-Agnostisch**: Neue Provider über `backend/utils/llm/[provider].js` hinzufügen

### Datenbank
- **Mongoose Models** in `backend/models/`
- **Schemas** für strikte Validierung in `backend/utils/schemas/`
- **Indexes** für häufige Queries definieren

### API Design
- **RESTful** Endpoints
- **Versionierung**: Aktuell V2 (`/api/v2/`)
- **Auth**: JWT + `x-header-secret-key` Header
- **Error Format**: `{ error: "Message" }`

### Internationalisierung
- **EINZIGE Quelle**: `frontend/src/locales/de-DE.json` - **NUR diese Datei wird manuell gepflegt!**
- **Workflow**: 
  1. Neue Strings nur in `de-DE.json` hinzufügen
  2. `npm run buildLang` ausführen (wird automatisch bei `npm run build` ausgeführt)
  3. Das Script `scripts/buildLang.js` übersetzt alle Strings per OpenAI API in alle anderen Sprachen (en-US, fr-FR, zh-CN, etc.)
- **WICHTIG**: Nie andere Locale-Dateien manuell editieren - diese werden bei jedem Build überschrieben!
- **Verfügbare Sprachen**: de-DE, de-AT, de-CH, en-US, en, fr-FR, zh-CN, hi-IN + regionale Dialekte

## 9. Deployment

### GitHub Actions
- `.github/workflows/deploy_backend.yml`: Backend Deployment
- `.github/workflows/deploy_mobile.yml`: Mobile App Build

### Production Build
```bash
# 1. Environment setzen (siehe 6.)
# 2. Build Frontend
npm run build
# 3. Deploy Backend
# 4. Sync Capacitor (Mobile)
npx cap sync
```

### Mobile Deployment
- **iOS**: Xcode Build
- **Android**: Gradle Build
- **Capacitor**: `npx cap copy && npx cap sync`

## 10. Sicherheit

- **Secrets**: Niemals in Git committen
- **JWT**: Regelmäßig rotieren
- **API Keys**: Provider-Secrets regelmäßig erneuern
- **CORS**: Korrekt konfiguriert im Backend
- **Validation**: Alle Inputs validieren (Mongoose + JSON Schema)

## 11. Troubleshooting

### Häufige Probleme

**Backend startet nicht**:
- Prüfe `.env` (alle Werte gesetzt?)
- MongoDB erreichbar?

**LLM Fehler**:
- API Keys gültig?
- `backend/utils/llm.js` und Schemas prüfen

**Frontend Build-Fehler**:
- `npm run install:frontend` ausführen
- `frontend/.env.production` vorhanden?

**Mobile Sync-Fehler**:
- `npx cap sync` nach Build ausführen
- Android Studio/Xcode korrekt konfiguriert?

## 12. Ressourcen

- **Discord Community**: https://discord.com/invite/qkxjGEp3Tg
- **Backend README**: `backend/README.md`
- **Frontend README**: `frontend/README.md`
- **Gemini Dokumentation**: `GEMINI.md`

## 13. Lizenz

- **Source Code**: PolyForm Noncommercial License 1.0.0
- **Assets** (Logos, Illustrationen): CC BY-NC 4.0

---

*Letzte Aktualisierung: 2026-02-01*
