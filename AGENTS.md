# Murmli Project: AI Agent Development Guide

This document serves as a unified guide for AI agents contributing to the Murmli monorepo. It outlines the architecture, workflows, and conventions for both the frontend and backend applications. Adhering to these guidelines is essential for maintaining a clean, consistent, and maintainable codebase.

## 1. Project Overview

Murmli is a comprehensive application designed to unify a user's daily planning needs in one place. It seamlessly integrates:

*   **Shopping Lists**
*   **Recipes**
*   **Meal Planning**
*   **Calorie Counter**
*   **Training Plans**

All these features are designed to interact with each other, providing a holistic user experience.

A key and innovative feature of Murmli is its use of **Large Language Models (LLMs)** to process natural language user inputs. This makes the app exceptionally flexible and user-friendly. For example, a user can simply type "ingredients for a lasagna" into their shopping list. The backend will then use an LLM, via external providers like OpenAI or Google, to interpret this request, generate a complete list of ingredients, and format it correctly for storage in the database. This powerful LLM integration is a core component of the application's intelligence.

The project is structured as a monorepo containing two main parts:

*   **Backend:** A Node.js and Express.js application.
*   **Frontend:** A Vue.js, Vite, and Ionic Framework application.

The following sections provide detailed development guides for each part of the project.

---

## 2. Getting Started: Installation

This project is a monorepo that uses npm workspaces. To install all dependencies for both the backend and frontend, you should run the following command from the root directory of the project:

```bash
npm run install:all
```

This command will execute `npm install` in the root directory, the `backend` directory, and the `frontend` directory, ensuring that all packages are set up correctly.

---

## 3. Running the Application

To run the application for development, you can use a single command from the root directory:

```bash
npm start
```

This will start both the backend and the frontend development server concurrently.

*   **Backend** will be running on `http://localhost:8080`.
*   **Frontend** will be running on `http://localhost:3000`.

**Important:** Before you can run the backend successfully, you must create a `.env` file inside the `backend` directory. You can do this by copying the example file:

```bash
cp backend/.env.example backend/.env
```

After copying, you must review and fill in the required environment variables (like `DB_STRING`, `JWT_SECRET`, etc.) in the `backend/.env` file.

---

## 4. Backend Development Guide

This section serves as a guide for AI agents working on this project. It describes the architecture, workflows, and conventions to be followed when developing new features or extending existing ones. The goal is to ensure clean, consistent, and maintainable code.

### 2.1. Backend Architecture

The backend is based on a classic **Model-View-Controller (MVC)** pattern and uses the following technologies:

*   **Node.js** as the runtime environment
*   **Express.js** as the web framework
*   **MongoDB** as the database
*   **Mongoose** as the ODM (Object Data Modeling) for interacting with MongoDB
*   **Swagger** for API documentation

#### 2.1.1. Project Structure

The backend is divided into the following main directories:

*   `controllers`: Contains the business logic of the application. Each controller file is responsible for a specific area of the application (e.g., `recipeController.js` for recipes).
*   `middlewares`: Contains middleware functions that are executed before the controllers, e.g., for authentication, authorization, or validation.
*   `models`: Defines the Mongoose schemas for the MongoDB database. Each model file represents a collection in the database.
*   `routes`: Defines the API endpoints of the application. Each route file groups endpoints belonging to a specific area (e.g., `recipeRoutes.js`).
*   `utils`: Contains reusable helper functions that can be used by different parts of the application (e.g., for translations, calculations, or interacting with external APIs).

**Note:** All files should use UTF-8 encoding to ensure proper handling of international characters and special symbols.

### 2.2. Handling LLM Requests

A central part of the application is the interaction with Large Language Models (LLMs) to enable intelligent functions such as creating recipes or training plans. The following section describes the process for handling these requests.

1.  **Receive User Request:** A user request that requires LLM interaction (e.g., "Create a vegan recipe with eggplant") is received via a dedicated endpoint.

2.  **Collect Data from User Context:** The controller function gathers relevant information from the user object (`req.user`), such as:
    *   Language (`user.language`)
    *   Dietary preferences (`user.dietLevel`, `user.dietType`)
    *   Favorite recipes (`user.favoriteRecipes`)
    *   Other user-specific settings

3.  **Create and Send LLM Request:**
    *   The collected user information is used to create a precise prompt for the LLM.
    *   The request is sent to the corresponding helper function in the `utils` directory (e.g., `createRecipe` in `recipeUtils.js`).
    *   This function interacts with the LLM (e.g., via the OpenAI API) and receives the generated data.

#### 2.2.1. Centralized Prompt Management

To ensure the consistency and maintainability of LLM interactions, all prompts are managed centrally in the file `utils/prompts.js`. This file exports functions that return the prompts as formatted strings. This ensures that:

*   **Consistency:** All agents use the same, predefined prompts.
*   **Maintainability:** Changes to prompts only need to be made in one central location.
*   **Clarity:** The separation of logic and prompts improves code readability.

If a new prompt is needed, it should be added to `utils/prompts.js` and imported from there into the corresponding helper function.

4.  **Process and Save Data in MongoDB:**
    *   The data generated by the LLM (e.g., a new recipe) is validated and converted into the corresponding Mongoose model format.
    *   The new data is saved in the MongoDB database and linked to the user's ID.

5.  **Asynchronous Processing:** Since LLM requests can take some time, they are processed asynchronously.
    *   The user immediately receives a response that their request is being processed (e.g., `HTTP 202 Accepted`).
    *   The actual LLM interaction and data processing happen in the background.
    *   Once the process is complete, the generated data is saved in the database and becomes available to the user.

### 2.3. Workflow for Adding a New Feature

To add a new feature to the backend, the following steps should be followed:

#### 2.3.1. Define the Route

*   Open the corresponding route file in the `routes` directory (e.g., `recipeRoutes.js` for a new recipe-related feature).
*   Add a new route with the appropriate HTTP method (e.g., `router.post`, `router.get`, `router.delete`).
*   Use the `secretKeyMiddleware` and `sessionMiddleware` for all routes that require authentication.
*   Document the new endpoint with **Swagger annotations**. This is crucial for API documentation and understanding its functionality.

**Example for a new route in `recipeRoutes.js`:**

```javascript
/**
 * @swagger
 * /api/v2/recipe/new-feature:
 *   post:
 *     tags:
 *       - Recipes
 *     summary: Description of the new feature
 *     description: Detailed description of what this feature does.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parameter1:
 *                 type: string
 *                 description: Description of parameter 1.
 *             required:
 *               - parameter1
 *     responses:
 *       200:
 *         description: Successful response.
 *       400:
 *         description: Bad request.
 *       500:
 *         description: Server error.
 */
router.post("/new-feature", secretKeyMiddleware, sessionMiddleware, recipeController.newFeature);
```

#### 2.3.2. Create the Controller Function

*   Open the corresponding controller file in the `controllers` directory (e.g., `recipeController.js`).
*   Create a new `async` function for the new route.
*   Implement the business logic within a `try...catch` block to handle errors properly.
*   Access the request and response objects (`req`, `res`) to receive and send data.
*   Use Mongoose models to interact with the database.
*   Use helper functions from the `utils` directory as needed.

**Example for a new controller function in `recipeController.js`:**

```javascript
exports.newFeature = async (req, res) => {
  try {
    const { parameter1 } = req.body;
    const user = req.user; // Access the authenticated user

    if (!parameter1) {
      return res.status(400).json({ error: "Parameter 1 is required" });
    }

    // Implement business logic here...

    return res.status(200).json({ message: "Feature executed successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
```

#### 2.3.3. Create a Model (if necessary)

*   If the new feature requires a new type of data, create a new model file in the `models` directory.
*   Define a new Mongoose schema with the required fields and data types.

**Example for a new model:**

```javascript
const mongoose = require("mongoose");

const newSchema = new mongoose.Schema({
  field1: {
    type: String,
    required: true,
  },
  field2: {
    type: Number,
    default: 0,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("NewModel", newSchema);
```

#### 2.3.4. Add Helper Functions (if necessary)

*   If you have reusable logic, add it to an appropriate file in the `utils` directory or create a new one.

### 2.4. Code Style and Conventions

*   **Language:** JavaScript (ES6+)
*   **Naming Conventions:**
    *   Variables and functions: `camelCase`
    *   Classes and models: `PascalCase`
    *   Files: `camelCase`
*   **Comments:** Write clear and concise comments to explain complex logic.
*   **Asynchronicity:** Use `async/await` for all asynchronous operations.

### 2.5. Guidelines for AI Agents

*   **Follow Existing Patterns:** When adding a new feature, follow the existing patterns in the `routes`, `controllers`, and `models` files.
*   **Authentication:** Always use the `authMiddleware` for routes that require user authentication.
*   **Reusability:** Use the helper functions in the `utils` directory to avoid code duplication.
*   **Documentation:** Carefully document all new API endpoints with Swagger annotations.
*   **Error Handling:** Implement robust error handling in all controller functions.
*   **Simplicity Over Cleverness:** Prefer clear, maintainable logic over clever tricks. Break complex flows into small helpers, rely on built-in Node.js/Express patterns, and avoid unnecessary abstractions so that the next agent can understand and debug the code quickly.

---

## 3. Frontend Development Guide

This document provides a comprehensive guide for AI agents to understand the structure and development workflows of the frontend application. Adhering to these guidelines is crucial for maintaining code quality and consistency.

### 3.1. Introduction

The frontend is a modern web application built with **Vue.js, Vite, and Ionic Framework**. It's designed to be a mobile-first, responsive, and performant user interface for the Murmli platform. This guide will walk you through the project structure, development processes, and best practices.

### 3.2. Project Structure

The `frontend` directory contains all the code for the user interface. Here's a breakdown of the most important files and directories:

*   **`public/`**: This directory contains static assets that are copied directly to the root of the `dist` directory during the build process. It includes the `favicon.ico` and other essential files.

*   **`src/`**: This is the heart of the application, containing all the source code.

    *   **`App.vue`**: The main root component of the application. It sets up the main layout and router view.

    *   **`main.js`**: The entry point of the application. It initializes the Vue app, router, Pinia store, and other plugins.

    *   **`assets/`**: This directory is for static assets that are processed by Vite during the build, such as images, fonts, etc.

    *   **`components/`**: Contains reusable Vue components that are used across different pages of the application (e.g., buttons, modals, input fields).

    *   **`layouts/`**: Holds layout components that define the structure of different parts of the application (e.g., a main layout with a sidebar and header).

    *   **`locales/`**: This directory contains JSON files for internationalization (i18n). Each file corresponds to a language (e.g., `en.json`, `de.json`).

    *   **`pages/`**: Contains the main page components of the application. Each `.vue` file in this directory typically represents a distinct route or view.

    *   **`plugins/`**: For Vue plugins that need to be initialized with the app.

    *   **`router/`**: This is where the Vue Router is configured. The `index.js` file defines all the application routes.

    *   **`stores/`**: Contains Pinia store modules for state management. Each file defines a separate store for a specific domain of the application (e.g., `userStore.js`, `recipeStore.js`).

    *   **`styles/`**: Holds global CSS styles, variables, and mixins that are used throughout the application.

*   **`capacitor.config.json`**: Configuration file for Capacitor, which is used to build the native mobile app.

*   **`ionic.config.json`**: Configuration file for the Ionic Framework.

*   **`vite.config.mjs`**: The configuration file for Vite, the build tool used for this project.

### 3.3. Development Workflow

To ensure consistency, please follow these workflows when adding new features or making changes.

#### 3.3.1. Adding a New Page

1.  **Create the Vue Component**: Create a new `.vue` file in the `src/pages/` directory. The file name should be in PascalCase (e.g., `MyNewPage.vue`).
2.  **Auto-Routing**: This project uses auto-routing, so you don't need to manually define routes. The file name will be used to create the route. For example, `MyNewPage.vue` will be accessible at `/my-new-page`.
3.  **Layout and Meta Information (YAML)**: To define the layout for a page or add other meta-information, use a `<route>` block with `lang="yaml"` at the end of your `.vue` file. This is a common pattern in this project.
    ```vue
    <route lang="yaml">
      meta:
        layout: defaultLayout
        requiresAuth: true
    </route>
    ```

#### 3.3.2. Adding a New Component

1.  **Create the Vue Component**: Create a new `.vue` file in the `src/components/` directory. The file name should be in PascalCase (e.g., `MyCustomButton.vue`).
2.  **Import and Use**: In the component or page where you want to use the new component, import it in the `<script setup>` section and then use it in the `<template>` section.
    ```vue
    <script setup>
    import MyCustomButton from '@/components/MyCustomButton.vue';
    </script>

    <template>
      <MyCustomButton />
    </template>
    ```

#### 3.3.3. State Management with Pinia

For managing global application state, we use Pinia. This is the primary way to share data between components.

1.  **Create a New Store**: If you need a new store, create a new file in `src/stores/` (e.g., `myNewStore.js`).
2.  **Define the Store**: Use the `defineStore` function from Pinia to create your store.
    ```javascript
    // src/stores/myNewStore.js
    import { defineStore } from 'pinia';

    export const useMyNewStore = defineStore('myNewStore', {
      state: () => ({
        // ... initial state
      }),
      actions: {
        // ... actions
      },
      getters: {
        // ... getters
      }
    });
    ```
3.  **Use the Store**: In any component, you can use the store by importing it and calling the `use...Store` function.
    ```vue
    <script setup>
    import { useMyNewStore } from '@/stores/myNewStore';

    const myNewStore = useMyNewStore();
    </script>
    ```

##### Dialog Management

A special store, `dialogStore.js`, is used to manage the state of all dialogs (modals) in the application. To open or close a dialog, you should use the functions provided by this store.

*   **Opening a Dialog**: `dialogStore.openDialog('myDialog')`
*   **Closing a Dialog**: `dialogStore.closeDialog('myDialog')`
*   **Toggling a Dialog**: `dialogStore.toggleDialog('myDialog')`

This centralized approach ensures that dialog states are managed consistently throughout the application.

#### 3.3.4. Styling

*   **Global Styles**: Global styles, CSS variables, and utility classes are defined in `src/styles/`.
*   **Component-Scoped Styles**: For styles that are specific to a single component, use the `<style scoped>` tag within the `.vue` file. This ensures that the styles do not leak to other components.

#### 3.3.5. Internationalization (i18n)

* **Adding Translations**: All source language strings are defined in `src/locales/de-DE.json`. This is the main file from which all other language files are automatically generated.
* **Note**: You only need to maintain the German file (`de-DE.json`). All other translations are generated based on this main file using automated translation tools.
* **Using Translations**: In your components, use the `$t()` function provided by the `vue-i18n` plugin to display translated text.

  ```vue
  <template>
    <h1>{{ $t('myNewPage.title') }}</h1>
  </template>
  ```

##### 3.3.5.1 (English) Language Templates with Variables (Placeholders)

When a language template needs dynamic values, declare placeholders in the source strings and replace them explicitly in code, mirroring the existing pattern in the repo.

- Source (`de-DE.json`): Use `{name}`-style placeholders.
  ```json
  {
    "training": {
      "caloriesBurned": "Verbrannte Kalorien: {calories}",
      "setSummary": "Satz {index}: {reps} Wiederholungen mit {weight} {unit}"
    }
  }
  ```

- Usage (Vue component): Fetch the translation and replace placeholders via `.replace()`.
  ```vue
  {{ languageStore.t('training.caloriesBurned').replace('{calories}', calories) }}
  ```

- Multiple variables: Chain `.replace()` calls in the order of placeholders.
  ```vue
  {{ languageStore
      .t('training.setSummary')
      .replace('{index}', String(index))
      .replace('{reps}', String(reps))
      .replace('{weight}', formattedWeight)
      .replace('{unit}', unit)
  }}
  ```

- Formatting: Format values before replacement (e.g., `toLocaleString`, rounding) so translations remain logic-free.
- Consistency: Keep sentence structure, spaces, and punctuation solely in the translation; do not append static text in code.
- Extensibility: Reuse the same placeholder names across languages. Always add new variables to the source string (`de-DE.json`) and then generate other locales.

### 3.4. API Interaction

The frontend communicates with the backend via a RESTful API. When fetching or sending data, use a centralized API client if available, or the standard `fetch` API or a library like `axios`. Ensure that you handle API responses correctly, including loading states, error handling, and user feedback.

### 3.5. Code Style and Linting

The project is set up with ESLint and Prettier to enforce a consistent code style. Please ensure that your code adheres to the configured rules. It's recommended to have the ESLint and Prettier extensions installed in your editor to get real-time feedback.

### 3.6. Keep the UI Code Simple

*   Favor straightforward Ionic/Vue patterns and avoid deeply nested abstractions or excessive reactive magic.
*   Small, focused components with obvious props are better than highly generic ones.
*   When in doubt, choose the solution that is easiest to read and reason about, even if it produces a few extra lines.
*   Robustness beats cleverness: handle loading/error states explicitly, and write defensive code instead of relying on implicit behavior.

By following these guidelines, you will help us maintain a clean, scalable, and maintainable codebase. Thank you for your contribution
