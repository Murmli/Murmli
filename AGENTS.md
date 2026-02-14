# AGENTS.md - Murmli Project Guidelines for AI Agents

## 1. Project Overview

**Murmli** is a fitness and lifestyle app combining shopping lists, recipes, meal planning, calorie tracking, and workout plans with LLM-powered features.

- **Structure**: Monorepo with `backend/` (Node.js/Express) and `frontend/` (Vue.js/Ionic)
- **URL**: https://github.com/Murmli/Murmli.git

`ALWAYS start a new task by creating a new git branch. Never commit directly to main.`

## 2. Build/Lint/Test Commands

### Development
```bash
npm start                    # Backend (8080) + Frontend (3000)
npm run dev                  # Backend (watch mode) + Frontend
npm run dev:backend          # Only backend with nodemon
npm run start:frontend       # Only frontend (Vite dev server)
```

### Build
```bash
npm run build                # Production build (runs buildLang + vite build)
```

### Lint
```bash
cd frontend && npm run lint  # ESLint with --fix
```

### Tests
```bash
# Backend Unit Tests (Jest)
cd backend && npm test                              # Run all tests
cd backend && npx jest tests/visitorTracking.test.js    # Single test file
cd backend && npx jest -t "should create a new visitor" # Single test by name

# E2E Tests (Playwright)
npm run test:e2e                                    # Run all E2E tests
npx playwright test tests/e2e/example.spec.ts       # Single E2E test file
```

## 3. Code Style Guidelines

### Language Rules
- **Code/Comments**: English
- **User Communication**: German (via i18n)
- **Git Commits**: English imperative ("Add feature", "Fix bug")

### Backend (Node.js/Express)

**Imports**: CommonJS with `require`
```javascript
const Recipe = require("../models/recipeModel.js");
const { translateRecipes } = require("../utils/translator.js");
```

**Error Handling**: Always wrap controllers in try/catch
```javascript
exports.readRecipe = async (req, res) => {
  try {
    // ... logic
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};
```

**Naming**:
- Files: camelCase (`recipeController.js`)
- Models: PascalCase (`RecipeModel.js`)
- Exports: `exports.functionName = async () => {}`

**Async**: Always use `async/await`, never raw Promises

### Frontend (Vue.js 3 + Vuetify)

**Component Structure**: `<script setup>` syntax
```vue
<template>
  <v-card>...</v-card>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useRecipeStore } from '@/stores/recipeStore';

const props = defineProps({
  recipe: { type: Object, required: true }
});
const emit = defineEmits(['swiped']);
</script>

<style scoped>
/* Scoped CSS here */
</style>
```

**Imports**:
- Stores: `import { useRecipeStore } from '@/stores/recipeStore'`
- Components: Auto-imported via unplugin

**Naming**:
- Components: PascalCase (`RecipeCardComponent.vue`)
- Stores: camelCase (`recipeStore.js`)
- CSS: scoped preferred, use CSS variables for theming

**API Calls**: Always via `apiStore.apiRequest`
```javascript
const apiStore = useApiStore();
const response = await apiStore.apiRequest('get', '/recipes');
```

### Database (MongoDB/Mongoose)

**Models** in `backend/models/` with PascalCase filenames
```javascript
const mongoose = require("mongoose");
const { Schema } = mongoose;

const recipeSchema = new Schema({
  title: { type: String, required: true },
  // ...
});

module.exports = mongoose.model("Recipe", recipeSchema);
```

## 4. Architecture Patterns

### LLM Pipeline (Critical)

All LLM calls follow this centralized flow:
1. Controller receives request
2. Calls function from `backend/utils/llm.js`
3. Prompts from `backend/utils/prompts.js`
4. Schema validation from `backend/utils/schemas/`
5. Provider call via `backend/utils/llm/[provider].js`

**NEVER** call LLM APIs directly from controllers. Always go through `llm.js`.

### API Design
- Base path: `/api/v2/`
- Auth: JWT Bearer token + `x-header-secret-key` header
- Errors: `{ error: "Message" }`
- Validation: Mongoose schemas + JSON schemas for LLM output

### Internationalization
- **Source of truth**: `frontend/src/locales/de-DE.json` ONLY
- Other locales auto-generated via `npm run buildLang` (OpenAI translation)
- **Never** manually edit other locale files

## 5. Environment Variables

Check existing `.env` files for required variables:
- `backend/.env` - Database, LLM provider keys, Azure storage
- `frontend/.env` - API URLs, feature flags

Key variables to verify before running:
- `DB_STRING` - MongoDB connection
- `LLM_PROVIDER` - Must be set (openai|google|deepseek|openrouter)
- `JWT_SECRET` - Auth token signing

## 6. Common Patterns

### Adding a new API endpoint
1. Create/update model in `backend/models/`
2. Create controller in `backend/controllers/`
3. Add route in `backend/routes/`
4. Create store function in frontend `stores/`

### Adding LLM-powered feature
1. Define JSON schema in `backend/utils/schemas/`
2. Add prompt in `backend/utils/prompts.js`
3. Add function in `backend/utils/llm.js`
4. Call from controller

### Adding frontend component
1. Create in feature subfolder (`components/recipe/`, `components/training/`)
2. Use `<script setup>` with defineProps/defineEmits
3. Import and use Pinia stores
4. Use `apiStore.apiRequest()` for API calls
5. Add i18n keys to `locales/de-DE.json` only

## 7. File Organization

```
Murmli/
├── backend/
│   ├── controllers/    # Route handlers
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routes
│   ├── utils/          # LLM, validations, helpers
│   │   ├── llm/        # Provider implementations
│   │   └── schemas/    # JSON schemas for LLM
│   └── tests/          # Jest unit tests
├── frontend/
│   └── src/
│       ├── components/ # Vue components (by feature)
│       ├── pages/       # Route pages
│       ├── stores/      # Pinia stores
│       └── locales/     # i18n (edit de-DE.json only)
└── tests/e2e/           # Playwright tests
```

## 8. Security

- Never commit secrets (`.env` files are gitignored)
- Validate all inputs (Mongoose + manual validation)
- Use HTTPS in production

---
*Last updated: 2026-02-14*