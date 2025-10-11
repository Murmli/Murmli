# Murmli Monorepo

Unified planning platform that combines shopping lists, recipes, meal plans, calorie tracking, and training programs. This monorepo hosts both the backend (Node.js/Express) and frontend (Vue/Ionic) applications.

## Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or hosted)
- Access tokens for your preferred LLM providers (e.g. Google, OpenAI, DeepSeek)

## Install & Run

1. **Install dependencies**
   ```bash
   npm run install:all
   ```
2. **Create environment files** (see the examples below and fill in your own secrets).
3. **Start the stack**
   ```bash
   npm start
   ```
   - Backend: http://localhost:8080
   - Frontend: http://localhost:3000

### Useful Scripts

- `npm run dev` – backend in watch mode + frontend dev server  
- `npm run build` – production build for the frontend  
- `npm run test:e2e` – Playwright end-to-end suite

## Environment Configuration

Keep real secrets out of version control. The file `frontend/.env.production` is ignored intentionally; create it locally when deploying.

### Backend (`backend/.env`)

```ini
DB_STRING=
PORT=
HOST=
APP_URL=
DEBUG=
JWT_SECRET=
SECRET_KEY=
LLM_PROVIDER=
LLM_CACHE_MAX_AGE_DAYS=
OPENROUTER_API_KEY=
OPENROUTER_LOW_MODEL=
OPENROUTER_HIGH_MODEL=
GOOGLE_API_KEY=
GOOGLE_LOW_MODEL=
GOOGLE_HIGH_MODEL=
OPENAI_API_KEY=
OPENAI_LOW_MODEL=
OPENAI_HIGH_MODEL=
OPENAI_TRANSCRIBE_MODEL=
DEEPSEEK_API_KEY=
DEEPSEEK_LOW_MODEL=
DEEPSEEK_HIGH_MODEL=
IDEOGRAM_API_KEY=
IDEOGRAM_MODEL=
IDEOGRAM_RECIPE_ASPECT=
RECIPE_SUGGESTIONS_PER_REQUEST=
AZURE_STORAGE_CONTAINER_NAME=
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_URL=
GMAIL_SMTP_USER=
GMAIL_SMTP_PASSWORD=
```

### Frontend (`frontend/.env` or `frontend/.env.production`)

```ini
VITE_API_BASE_URL=
VITE_HEADER_SECRET_KEY=
VITE_MIN_RECIPE_SUGGESTIONS=
VITE_RECIPE_FETCH_COUNT=
OPENAI_API_KEY=
OPENAI_TRANSLATION_MODEL=
```

## Deployment Notes

- Provide production-ready values in `frontend/.env.production` before building with `npm run build`.
- Ensure the backend `.env` is configured with production database and provider credentials.
- Regenerate tokens or rotate secrets periodically according to provider policies.

## Additional Resources

- `AGENTS.md` – in-depth architecture and contribution guidelines for AI agents
- `backend/README.md` and `frontend/README.md` – component-specific guides

