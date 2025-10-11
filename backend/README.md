# Murmli Backend

Node.js (Express) service that powers the Murmli platform. Handles REST APIs, MongoDB persistence, and all LLM-driven workflows.

## Prerequisites

- Node.js 18+ and npm
- MongoDB instance
- API keys for any LLM providers you plan to use (Google, OpenAI, DeepSeek, OpenRouter, Ideogram)

## Install

Run from the monorepo root:

```bash
npm run install:backend
```

## Environment Variables

Create `backend/.env` and include every key below. Leave values empty if they are not required for your setup.

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

- `SECRET_KEY` must be sent as `x-header-secret-key` with authenticated requests.
- Adjust `RECIPE_SUGGESTIONS_PER_REQUEST` to control how many recipe ideas are generated per request.
- Keep `APP_URL` and `PORT` in sync with the frontend configuration.

## Run

- Development (watch mode):
  ```bash
  npm run dev:backend
  ```
- Production or simple start:
  ```bash
  npm run start:backend
  ```

The server defaults to `http://localhost:8080`. Swagger UI is available at `http://localhost:8080/api-docs` when enabled.

## Tips

- Rotate provider secrets regularly.
- Ensure all required API keys are set before deploying to production.
