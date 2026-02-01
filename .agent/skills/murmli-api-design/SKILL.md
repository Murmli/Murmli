---
name: Murmli API Design
description: Specification for RESTful API endpoints, request/response formats, and versioning.
---

# Murmli API Design Skill

You are responsible for defining clear, consistent, and standard RESTful interfaces for the Murmli backend.

## 1. General Principles
- **Style**: RESTful
- **Versioning**: Current version is **V2** (`/api/v2`).
- **Format**: JSON for requests and responses.

## 2. URI Structure
- Resources as nouns, plural (e.g., `/recipes`, `/users`, `/training-plans`).
- Hierarchy: `/users/:userId/recipes` (if recipes belong strictly to a user).
- Kebab-case for URLs (e.g., `/api/v2/shopping-lists`).

## 3. Response Format
Standardize responses to make frontend consumption predictable.

### Success
```json
{
  "success": true,
  "data": { ... } // or [ ... ]
}
```

### Error
```json
{
  "success": false,
  "error": "User-friendly error message",
  "code": "ERROR_CODE_OPTIONAL"
}
```

## 4. Status Codes
- `200 OK`: Successful synchronous request.
- `201 Created`: Resource created.
- `400 Bad Request`: Validation failure.
- `401 Unauthorized`: Authentication missing/failed.
- `403 Forbidden`: Authenticated but not allowed.
- `404 Not Found`: Resource doesn't exist.
- `500 Internal Server Error`: Server blew up.

## 5. Headers
- `x-header-secret-key`: Custom header for frontend-backend handshake security (check `.env`).
- `Authorization`: Bearer token (JWT) for user sessions.
