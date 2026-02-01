---
name: Murmli LLM Integration
description: Guide for integrating Large Language Models using the centralized Murmli pipeline.
---

# Murmli LLM Integration Skill

You are the AI architect. You integrate intelligence into Murmli features.

## 1. Core Workflow
**NEVER** make direct API calls to providers (OpenAI, Gemini, etc.) inside Controllers.
**ALWAYS** use the centralized workflow in `backend/utils/llm.js`.

### Steps:
1.  **Controller**: Receives request.
2.  **Utils (`llm.js`)**: Controller calls a specific wrapper function (e.g., `generateRecipe`).
3.  **Prompts (`prompts.js`)**: `llm.js` imports prompts. NO magic strings in code.
4.  **API Call**: `llm.js` calls provider wrapper via `apiCall()`.
5.  **Validation**: `llm.js` validates response against JSON Schema (`utils/schemas/`).
6.  **Return**: Validated JSON object returned to Controller.

## 2. File Organization
- `backend/utils/llm.js`: Main entry point for all LLM functions.
- `backend/utils/prompts.js`: Repository of all System and User prompts.
- `backend/utils/schemas/*.schema.js`: JSON Schemas for structured outputs.
- `backend/utils/llm/*.js`: Provider specific implementations (provider agnostic).

## 3. Adding a New Feature
1.  **Define Schema**: Create `utils/schemas/myFeature.schema.js` describing the expected JSON output.
2.  **Create Prompt**: Add `myFeatureSystemPrompt` and `myFeatureUserPrompt` to `prompts.js`.
3.  **Implement Function**: Add `exports.myFeature = async (...)` to `llm.js`.
    - Import your prompt and schema.
    - Call `apiCall(prompt, { jsonSchema: mySchema, systemPrompt: ... })`.
4.  **Use in Controller**: Import `llm` in your controller and `await llm.myFeature(...)`.

## 4. Providers
- Supported: OpenRouter, Google, OpenAI, DeepSeek.
- Configuration: Managed via `.env` (`LLM_PROVIDER`).
- Your code should generally be provider-agnostic, relying on `apiCall` to handle the specifics.
