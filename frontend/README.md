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
OPENAI_API_KEY=
OPENAI_TRANSLATION_MODEL=
```

### Example `.env.production` (deployment)

```ini
VITE_API_BASE_URL=
VITE_BACKEND_BASE_URL=
VITE_HEADER_SECRET_KEY=
VITE_MIN_RECIPE_SUGGESTIONS=
VITE_RECIPE_FETCH_COUNT=
OPENAI_API_KEY=
OPENAI_TRANSLATION_MODEL=
```

Guidelines:

- `VITE_API_BASE_URL`: Base URL of the backend API (`https://…/api/v2` in production).
- `VITE_BACKEND_BASE_URL`: Base URL of the backend for static pages (`https://…` in production, used for recipe sharing).
- `VITE_HEADER_SECRET_KEY`: Must match `SECRET_KEY` from the backend.
- `VITE_MIN_RECIPE_SUGGESTIONS` / `VITE_RECIPE_FETCH_COUNT`: Control recipe pagination in the UI.
- `OPENAI_API_KEY` and `OPENAI_TRANSLATION_MODEL`: Required for the automated locale generation used during builds.
