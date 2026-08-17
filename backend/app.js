const express = require("express");
const mongoose = require("mongoose");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const systemRoutes = require("./routes/systemRoutes.js");
const sessionRoutes = require("./routes/sessionRoutes.js");
const shoppingListRoutes = require("./routes/shoppingListRoutes.js");
const planerRoutes = require("./routes/planerRoutes.js");
const recipeRoutes = require("./routes/recipeRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const trackerRoutes = require("./routes/trackerRoutes.js");
const trainingPlanRoutes = require("./routes/trainingPlanRoutes.js");
const trainingLogRoutes = require("./routes/trainingLogRoutes.js");
const visitorRoutes = require("./routes/visitorRoutes.js");
const messageRoutes = require("./routes/messageRoutes.js");
const { generateRecipeSitemap } = require("./utils/sitemapUtils.js");
const app = express();
const cors = require("cors");
const path = require("path");


mongoose
  .connect(process.env.DB_STRING, {})
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.use(express.json());

// Swagger setup
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Backend API",
    version: "1.0.0",
    description: "API documentation",
  },
  servers: [
    {
      url: process.env.APP_URL || "http://localhost:8080", // dynamisch aus .env
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      secretKeyHeader: {
        type: "apiKey",
        in: "header",
        name: "X-Header-Secret-Key",
        description: "Secret key header for additional security",
      },
    },
  },
  security: [
    {
      bearerAuth: [],
      secretKeyHeader: [],
    },
  ],
};

const swaggerOptions = {
  swaggerDefinition,
  apis: ["./routes/*.js", "./app.js"], // Pfad zu den API-Routen und app.js für Swagger-Doku
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger JSDOC JSON endpoint
app.get('/api-docs/all.json', (req, res) => {
  // ensure correct content type
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none' // This ensures all tags are collapsed initially
  }
}));

// CORS Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "https://localhost", "capacitor://localhost"],
    methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization", "X-Header-Secret-Key"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Delay Middleware - verzögert alle Anfragen um x Sekunde
// app.use((req, res, next) => {
//   setTimeout(next, 5000);
// });

// SEO Redirect Middleware
app.use((req, res, next) => {
  const host = req.headers.host;
  const path = req.url;

  // Exclude API routes from redirects
  if (path.startsWith('/api')) {
    return next();
  }

  // 1. Redirect non-www to www (Production only or if host matches murmli.de)
  if (host === 'murmli.de') {
    return res.redirect(301, `https://www.murmli.de${path}`);
  }

  // 2. Redirect /index.html to /
  if (path === '/index.html' || path.endsWith('/index.html')) {
    const newPath = path.replace(/\/index\.html$/, '/');
    return res.redirect(301, newPath || '/');
  }

  next();
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

app.get("/sitemap.xml", async (req, res) => {
  try {
    const fallbackUrl = `${req.protocol}://${req.get("host")}`;
    const baseUrl = process.env.PUBLIC_BASE_URL || process.env.APP_URL || fallbackUrl;
    const sitemap = await generateRecipeSitemap(baseUrl);
    res.type("application/xml").send(sitemap);
  } catch (error) {
    console.error("Failed to generate sitemap", error);
    res.status(500).send("Sitemap wird gerade aktualisiert.");
  }
});

// Helper to render templates with translations
const fs = require('fs');
const localesCache = {};

const AVAILABLE_LOCALES = [
  { code: "de-DE", name: "Deutsch", flag: "🇩🇪" },
  { code: "de-AT", name: "Österreich", flag: "🇦🇹" },
  { code: "de-CH", name: "Schweiz", flag: "🇨🇭" },
  { code: "de-BY", name: "Bayern", flag: "🥨" },
  { code: "de-SB", name: "Schwaben", flag: "🥨" },
  { code: "de-DY", name: "Jugendslang", flag: "🔥" },
  { code: "en-US", name: "English (US)", flag: "🇺🇸" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "en-US-bx", name: "US (Boston)", flag: "🇺🇸" },
  { code: "en-US-sx", name: "US (Southern)", flag: "🇺🇸" },
  { code: "en-US-cx", name: "US (California)", flag: "🏄" },
  { code: "fr-FR", name: "Français", flag: "🇫🇷" },
  { code: "es-ES", name: "Español", flag: "🇪🇸" },
  { code: "it-IT", name: "Italiano", flag: "🇮🇹" },
  { code: "pl-PL", name: "Polski", flag: "🇵🇱" },
  { code: "cs-CZ", name: "Čeština", flag: "🇨🇿" },
  { code: "sl-SI", name: "Slovenščina", flag: "🇸🇮" },
  { code: "tr-TR", name: "Türkçe", flag: "🇹🇷" },
  { code: "zh-CN", name: "中文", flag: "🇨🇳" },
  { code: "hi-IN", name: "हिन्दी", flag: "🇮🇳" }
];

const parseCookieHeader = (cookieHeader) => {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, part) => {
    const [key, ...val] = part.trim().split('=');
    if (key) acc[key] = decodeURIComponent(val.join('='));
    return acc;
  }, {});
};

const parseAcceptLanguage = (header) => {
  if (!header) return [];
  return header
    .split(',')
    .map(item => {
      const [lang, qPart] = item.trim().split(';');
      let q = 1.0;
      if (qPart && qPart.trim().startsWith('q=')) {
        const parsedQ = parseFloat(qPart.trim().substring(2));
        if (!isNaN(parsedQ)) q = parsedQ;
      }
      return { lang: lang ? lang.trim() : '', q };
    })
    .filter(item => item.lang && item.lang !== '*')
    .sort((a, b) => b.q - a.q);
};

const findMatchingLocale = (candidateCode) => {
  if (!candidateCode || typeof candidateCode !== 'string') return null;
  const clean = candidateCode.toLowerCase().trim();

  // 1. Exact match
  const exact = AVAILABLE_LOCALES.find(l => l.code.toLowerCase() === clean);
  if (exact) return exact.code;

  // 2. Primary subtag mapping
  const primary = clean.split('-')[0];
  const primaryMap = {
    de: 'de-DE',
    en: 'en-US',
    fr: 'fr-FR',
    es: 'es-ES',
    it: 'it-IT',
    pl: 'pl-PL',
    cs: 'cs-CZ',
    sl: 'sl-SI',
    tr: 'tr-TR',
    zh: 'zh-CN',
    hi: 'hi-IN'
  };
  if (primaryMap[primary]) return primaryMap[primary];

  // 3. Prefix match with any available locale
  const prefixMatch = AVAILABLE_LOCALES.find(l => l.code.toLowerCase().startsWith(primary));
  if (prefixMatch) return prefixMatch.code;

  return null;
};

const resolveLocale = (req) => {
  // 1. Query parameter (?lang=... or ?locale=...)
  const queryLang = req.query?.lang || req.query?.locale;
  if (queryLang) {
    const matched = findMatchingLocale(queryLang);
    if (matched) return matched;
  }

  // 2. Accept-Language header (weighted)
  const acceptLangHeader = req.headers ? req.headers['accept-language'] : null;
  if (acceptLangHeader) {
    const parsed = parseAcceptLanguage(acceptLangHeader);
    for (const item of parsed) {
      const matched = findMatchingLocale(item.lang);
      if (matched) return matched;
    }
  }

  // 3. Default fallback to de-DE
  return 'de-DE';
};

const loadLocaleData = (localeCode) => {
  if (!localesCache[localeCode]) {
    const localePath = path.join(__dirname, 'locales', `${localeCode}.json`);
    if (fs.existsSync(localePath)) {
      localesCache[localeCode] = JSON.parse(fs.readFileSync(localePath, 'utf8'));
    } else {
      localesCache[localeCode] = null;
    }
  }
  return localesCache[localeCode];
};

const getNestedValue = (obj, pathStr) => {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = pathStr.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr && typeof curr === 'object' && part in curr) {
      curr = curr[part];
    } else {
      return undefined;
    }
  }
  return curr;
};

const renderTemplate = (templatePath, locale) => {
  let template = fs.readFileSync(templatePath, 'utf8');

  const fallbackTranslations = loadLocaleData('de-DE') || {};
  const translations = loadLocaleData(locale) || fallbackTranslations;

  // Calculator dynamic translations
  const calcTranslations = translations.calculator?.results || fallbackTranslations.calculator?.results || {};

  // Replace all {{placeholder}} occurrences
  let rendered = template.replace(/\{\{([\w.]+)\}\}/g, (match, keyPath) => {
    if (keyPath === 'active_locale') return locale;
    if (keyPath === 'html_lang') return locale.split('-')[0];
    if (keyPath === 'calculator_i18n_json') return JSON.stringify(calcTranslations);

    const val = getNestedValue(translations, keyPath);
    if (val !== undefined && val !== null) {
      return typeof val === 'object' ? JSON.stringify(val) : String(val);
    }
    const fallbackVal = getNestedValue(fallbackTranslations, keyPath);
    if (fallbackVal !== undefined && fallbackVal !== null) {
      return typeof fallbackVal === 'object' ? JSON.stringify(fallbackVal) : String(fallbackVal);
    }
    return match;
  });

  // Replace <html lang="..."> with correct locale
  rendered = rendered.replace(/<html lang="[^"]*">/, `<html lang="${locale.split('-')[0]}">`);

  return rendered;
};

// Route to serve the landing page
app.get("/", (req, res) => {
  const locale = resolveLocale(req);

  // Clear any stale appLocale cookie from past sessions
  if (req.headers?.cookie && req.headers.cookie.includes('appLocale=')) {
    res.setHeader('Set-Cookie', 'appLocale=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax');
  }

  try {
    const renderedHtml = renderTemplate(path.join(__dirname, "public", "index.template.html"), locale);
    res.send(renderedHtml);
  } catch (error) {
    console.error("Error rendering landing page:", error);
    res.sendFile(path.join(__dirname, "public", "index.bak.html"));
  }
});

// Route to serve public recipe pages
app.get("/recipe/:slug-:id", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "recipe.html"));
});

// Routes
app.get("/api/v2/ping", (req, res) => {
  res.status(200).send({ message: "pong" });
});

// debug routes
app.all("/api/v2/400/*", (req, res) => {
  res.status(400).json({ error: "Bad Request", message: "This is a simulated 400 error" });
});

app.all("/api/v2/500/*", (req, res) => {
  res.status(500).json({ error: "Internal Server Error", message: "This is a simulated 500 error" });
});

app.all("/api/v2/timeout", (req, res) => {
  setTimeout(() => {
    res.status(408).json({ error: "Request Timeout", message: "This is a simulated timeout" });
  }, 60000);
});

app.all("/api/v2/empty", (req, res) => {
  res.status(204).send();
});

app.use("/api/v2/system", systemRoutes);
app.use("/api/v2/session", sessionRoutes);
app.use("/api/v2/shoppingList", shoppingListRoutes);
app.use("/api/v2/planer", planerRoutes);
app.use("/api/v2/recipe", recipeRoutes);
app.use("/api/v2/user", userRoutes);
app.use("/api/v2/calorietracker", trackerRoutes);
app.use("/api/v2/training-plans", trainingPlanRoutes);
app.use("/api/v2/training-logs", trainingLogRoutes);
app.use("/api/v2/visitor", visitorRoutes);
app.use("/api/v2/messages", messageRoutes);

app.resolveLocale = resolveLocale;
app.renderTemplate = renderTemplate;
app.AVAILABLE_LOCALES = AVAILABLE_LOCALES;
app.findMatchingLocale = findMatchingLocale;
app.parseAcceptLanguage = parseAcceptLanguage;

module.exports = app;
