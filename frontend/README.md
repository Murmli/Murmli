# Murmli Frontend

Vue 3 + Ionic interface for Murmli. This document only covers the environment variables required to run and build the frontend.

## Environment Files

Create your env files inside the `frontend` directory. Vite loads `.env` for development and `.env.production` for production builds.

### Example `.env` (development)

```ini
VITE_API_BASE_URL=
VITE_BACKEND_BASE_URL=
VITE_HEADER_SECRET_KEY=
VITE_MIN_RECIPE_SUGGESTIONS=
VITE_RECIPE_FETCH_COUNT=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-3-flash-preview
```

### Example `.env.production` (deployment)

```ini
VITE_API_BASE_URL=
VITE_BACKEND_BASE_URL=
VITE_HEADER_SECRET_KEY=
VITE_MIN_RECIPE_SUGGESTIONS=
VITE_RECIPE_FETCH_COUNT=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-3-flash-preview
```

Guidelines:

- `VITE_API_BASE_URL`: Base URL of the backend API (`https://…/api/v2` in production).
- `VITE_BACKEND_BASE_URL`: Base URL of the backend for static pages (`https://…` in production, used for recipe sharing).
- `VITE_HEADER_SECRET_KEY`: Must match `SECRET_KEY` from the backend.
- `VITE_MIN_RECIPE_SUGGESTIONS` / `VITE_RECIPE_FETCH_COUNT`: Control recipe pagination in the UI.
- `OPENROUTER_API_KEY`: API key for OpenRouter (or use `OPENAI_API_KEY` as fallback). Required for automated locale generation.
- `OPENROUTER_MODEL`: The model used for translations (default: `google/gemini-3-flash-preview`).
