---
name: Murmli Speech System
description: Documentation of the speech recording and processing pipeline.
---

# Murmli Speech System Skill

You enable voice interactions within the app.

## 1. Frontend Recording
- **Component**: ` VoiceInputDialog.vue`
- **Mechanism**: standard HTML5 `MediaRecorder` API.
- **Output**: `audio/wav` Blob.
- **Events**: Emits `completed` event with `{ audioBlob, text (optional) }`.

## 2. Processing Flows

### Mode: 'transcribe' (Frontend-driven transcription)
1. `VoiceInputDialog` records audio.
2. Calls `apiStore.transcribeAudio(blob)`.
3. Backend uses LLM/Whisper to transcribe.
4. Returns text to component.

### Mode: 'audio' (Backend-driven processing)
1. `VoiceInputDialog` records audio.
2. Component emits blob to parent.
3. Parent sends blob to specific backend endpoint (e.g., `/api/v2/recipes/create-from-voice`).
4. Backend Controller receives file (`multer`).
5. Controller calls `llm.audioToItemArray()` or `llm.audioToTrack()`.
6. `llm.js` sends audio to Provider (OpenAI/Gemini) which supports multimodal input or transcription+analysis.

## 3. Backend Utils (`llm.js`)
- `audioToItemArray(file)`: Extracts shopping list items directly from audio.
- `audioToTrack(file)`: Extracts nutrition tracking info from audio.
- These functions handle the complexity of "Audio -> JSON" in one step if the provider supports it, or "Audio -> Text -> JSON" if not.

## 4. Usage in Components
```html
<VoiceInputDialog
  dialogKey="myVoiceDialog"
  mode="audio" <!-- or "transcribe" -->
  @completed="handleVoiceResult"
/>
```
