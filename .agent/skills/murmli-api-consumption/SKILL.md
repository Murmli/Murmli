---
name: Murmli API Consumption
description: Guidelines for fetching data in the Vue frontend using apiStore.
---

# Murmli API Consumption Skill

You consume the backend APIs to power the frontend interface.

## 1. Centralized Store
All API interactions run through `apiStore` (or specific domain stores that use `apiStore`).
**NEVER** use `fetch` or `axios` directly in components.

## 2. Usage Pattern
```javascript
import { useApiStore } from '@/stores/apiStore';
const apiStore = useApiStore();

// GET request
const data = await apiStore.apiRequest('/endpoint', 'GET');

// POST request with body
const result = await apiStore.apiRequest('/endpoint', 'POST', {
  key: 'value'
});
```

## 3. Handling Loading States
- Stores usually have `isLoading` or `isProcessing` state variables.
- Wrap calls:
  ```javascript
  isLoading.value = true;
  try {
    await apiStore.someAction();
  } finally {
    isLoading.value = false;
  }
  ```

## 4. Error Handling
- `apiStore.apiRequest` usually throws or returns errors.
- Handle them in the component or store action.
- Use `toastStore` to display user-friendly errors.

## 5. Security Headers
- `apiStore` automatically attaches:
  - `x-header-secret-key` (from env)
  - `Authorization` (Bearer token if logged in)
