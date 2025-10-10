# Murmli Frontend

## Environment Variables

The frontend uses Vite environment files. Create `.env` for development and `.env.production` for a production build inside the `frontend` folder.

Example `.env`:

```bash
VITE_API_BASE_URL=http://localhost:8080/api/v2
VITE_HEADER_SECRET_KEY=moc7w4zr97nwt43
VITE_MIN_RECIPE_SUGGESTIONS=5
VITE_RECIPE_FETCH_COUNT=3
```

Example `.env.production`:

```bash
VITE_API_BASE_URL=https://api.example.com/api/v2
VITE_HEADER_SECRET_KEY=your-production-secret-key
VITE_MIN_RECIPE_SUGGESTIONS=5
VITE_RECIPE_FETCH_COUNT=3
```

Vite automatically loads the correct file based on the build mode. Use `npm run dev` for development or `npm run build` for production.

## .env for buildLang script

```bash
OPENAI_API_KEY=
OPENAI_TRANSLATION_MODEL=
```

### Translation setup

The `buildLang` script uses OpenAI to generate missing locale files. It is
executed automatically when running `npm run build`.

Set `OPENAI_TRANSLATION_MODEL` to a model that supports JSON responses, for
example `gpt-4o` or `gpt-4-turbo`.

## android/app/src/main/AndroidManifest.xml

```example
    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-feature android:name="android.hardware.audio.pro" android:required="false" />
    <uses-feature android:name="android.hardware.microphone"/>
```
