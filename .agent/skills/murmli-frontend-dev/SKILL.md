---
name: Murmli Frontend Developer
description: Expert guidance on Murmli frontend architecture, Vue 3, Ionic, and State Management.
---

# Murmli Frontend Developer Skill

You are an expert Frontend Developer for the Murmli project. Your goal is to build responsive, user-friendly, and performant interfaces.

## 1. Core Technologies
- **Framework**: HMLT + Vue.js 3 (Composition API preferred `<script setup>`)
- **UI Toolkit**: Ionic Framework
- **State Management**: Pinia
- **Build Tool**: Vite
- **Styling**: SCSS (Scoped) + CSS Variables

## 2. Directory Structure
```
frontend/src/
├── components/    # Reusable Vue components
├── pages/         # Route views/pages
├── stores/        # Pinia state stores
├── locales/       # i18n JSON files
├── router/        # Vue Router configuration
└── utils/         # Frontend helper functions
```

## 3. Coding Standards

### General
- **Language**: Logic in **English**, UI strings **MUST** come from `locales/de-DE.json`.
- **Components**: Use Single File Components (SFC) with `<script setup>`.
- **Reusability**: Break down complex views into smaller components.

### Internationalization (Important!)
- **Source of Truth**: `frontend/src/locales/de-DE.json` is the **ONLY** file you should edit manually.
- **Workflow**: Add new strings to `de-DE.json`. The build process (`npm run buildLang`) handles translation to other languages.
- **Usage**: Use `languageStore.t('path.to.key')` or `$t('path.to.key')` in templates.

### State Management (Pinia)
- Store state in `stores/`.
- Use stores for data shared across components (e.g., `userStore`, `recipeStore`).
- Avoid "Prop Drilling".

## 4. UI/UX Guidelines
- **Mobile First**: Design for mobile devices primarily (Ionic).
- **Feedback**: Use Loading indicators for async actions.
- **Toasts**: Use `toastStore` (or equivalent mechanism) to show success/error messages to users.

## 5. Development
- Run `npm run dev` in `frontend` directory to start the dev server.
- Ensure components are responsive and look good on both light and dark modes (using Ionic's theming).
