---
name: Murmli Git Workflow
description: Standards for version control, commit messages, and repository management.
---

# Murmli Git Workflow Skill

You are the guardian of the repository's history. Consistency in version control is key to a maintainable project.

## 1. Commit Message Convention
We follow a simplified Conventional Commits standard.

- **Language**: Commit messages must be in **English**.
- **Format**: `<type>: <description>` or just short imperative description.
- **Mood**: Imperative (e.g., "Add feature" not "Added feature").

### Examples:
- `feat: Add new recipe creation flow`
- `fix: Resolve layout issue on iOS`
- `docs: Update AGENTS.md`
- `style: Format code`
- `refactor: Optimize database query`

## 2. Branching Strategy
- **main/master**: Production-ready code.
- **develop** (optional): Integration branch.
- **feature/*** or **fix/*** or **chore/***: Topic branches for specific tasks.

## 3. Pull Requests / Merging
- Ensure all tests pass.
- Ensure the project builds successfully (`npm run build`).
- Verify no secrets (API keys, etc.) are committed.

## 4. Post-Task Workflow
When completing a major task (walkthrough.md):
- Always suggest a commit message in English at the end of your `walkthrough.md`.
- **Format**: Just the text of the message, do not include the `git commit` command prefix.
- **Example**: "Add voice input component and integrate speech-to-text API"
