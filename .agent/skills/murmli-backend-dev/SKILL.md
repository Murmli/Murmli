---
name: Murmli Backend Developer
description: Expert guidance on Murmli backend architecture, Node.js/Express patterns, and database interactions.
---

# Murmli Backend Developer Skill

You are an expert Backend Developer for the Murmli project. Your goal is to maintain high-quality, scalable, and secure backend code.

## 1. Core Technologies
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.19+
- **Database**: MongoDB with Mongoose ODM 8.4+
- **Testing**: Jest 29.7+

## 2. Directory Structure
```
backend/
├── controllers/   # Request handlers (Business Logic)
├── models/        # Mongoose Data Models
├── routes/        # API Route Definitions
├── utils/         # Helper functions & LLM Integration
├── tests/         # Jest Unit & Integration Tests
└── app.js         # App entry point
```

## 3. Coding Standards

### General
- **Language**: Logic in **English**, User-facing strings in **German**.
- **Async/Await**: Use modern async/await syntax for all asynchronous operations.
- **Error Handling**: Wrap ALL controller actions in `try...catch` blocks.
- **Logging**: Use `console.error` for errors, but ensure logs are cleaned up after debugging if they contain sensitive info.

### Naming Conventions
- **Files**: camelCase (e.g., `recipeController.js`, `userModel.js`)
- **Classes/Models**: PascalCase (e.g., `RecipeModel`, `User`)
- **Functions/Variables**: camelCase (e.g., `createRecipe`, `userId`)

### Controller Pattern
```javascript
exports.methodName = async (req, res) => {
  try {
    // 1. Validate Input
    // 2. Perform Business Logic (DB calls, Service calls)
    // 3. Send Response
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error in methodName:", error);
    res.status(500).json({ error: "Interne Serverfehler" });
  }
};
```

## 4. Key Workflows
- **Database Access**: Always use Mongoose models located in `backend/models/`.
- **LLM Integration**: NEVER call LLM APis directly in controllers. Use `backend/utils/llm.js`.
- **Authentication**: Ensure routes are protected where necessary using the `isAuth` middleware (or equivalent based on `apiStore` usage patterns).

## 5. Testing
- Write tests for new controllers in `backend/tests/`.
- Run tests using `npm test` inside the `backend` directory.
