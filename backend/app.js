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

const renderTemplate = (templatePath, locale) => {
  let template = fs.readFileSync(templatePath, 'utf8');
  
  // Load locale data
  if (!localesCache[locale]) {
    const localePath = path.join(__dirname, 'locales', `${locale}.json`);
    if (fs.existsSync(localePath)) {
      localesCache[locale] = JSON.parse(fs.readFileSync(localePath, 'utf8'));
    } else {
      // Fallback to de-DE
      const fallbackPath = path.join(__dirname, 'locales', 'de-DE.json');
      localesCache[locale] = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
    }
  }

  const translations = localesCache[locale];

  // Simple recursive placeholder replacement
  const replacePlaceholders = (text, data, prefix = '') => {
    let result = text;
    for (const key in data) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
        result = replacePlaceholders(result, data[key], fullKey);
      } else if (Array.isArray(data[key])) {
        data[key].forEach((item, index) => {
          if (typeof item === 'object') {
            result = replacePlaceholders(result, item, `${fullKey}.${index}`);
          } else {
            const regex = new RegExp(`{{${fullKey}.${index}}}`, 'g');
            result = result.replace(regex, item);
          }
        });
      } else {
        const regex = new RegExp(`{{${fullKey}}}`, 'g');
        result = result.replace(regex, data[key]);
      }
    }
    return result;
  };

  let rendered = replacePlaceholders(template, translations);
  
  // Replace <html lang="de"> with correct locale
  rendered = rendered.replace('<html lang="de">', `<html lang="${locale.split('-')[0]}">`);
  
  return rendered;
};

// Route to serve the landing page
app.get("/", (req, res) => {
  const host = req.headers.host;
  
  // Detect locale from query param or header
  let locale = req.query.lang;
  if (!locale) {
    const acceptLang = req.headers['accept-language'];
    if (acceptLang) {
      // Simple parsing: take the first one
      const preferred = acceptLang.split(',')[0].split(';')[0];
      // Map to supported locales if possible, otherwise default to de-DE
      // This is a simplified check, ideally we'd match against backend/locales/*.json
      if (preferred.startsWith('en')) locale = 'en';
      else if (preferred.startsWith('fr')) locale = 'fr-FR';
      else if (preferred.startsWith('it')) locale = 'it-IT';
      else if (preferred.startsWith('es')) locale = 'es-ES';
      else if (preferred.startsWith('pl')) locale = 'pl-PL';
      else if (preferred.startsWith('cs')) locale = 'cs-CZ';
      else if (preferred.startsWith('sl')) locale = 'sl-SI';
      else if (preferred.startsWith('tr')) locale = 'tr-TR';
      else if (preferred.startsWith('zh')) locale = 'zh-CN';
      else if (preferred.startsWith('hi')) locale = 'hi-IN';
      else locale = 'de-DE';
    } else {
      locale = 'de-DE';
    }
  }

  // Ensure it's a valid locale we have a file for
  const localePath = path.join(__dirname, 'locales', `${locale}.json`);
  if (!fs.existsSync(localePath)) {
    // Check if we have a partial match like 'en' -> 'en.json' or 'en-US.json'
    if (locale === 'en' && fs.existsSync(path.join(__dirname, 'locales', 'en-US.json'))) {
      locale = 'en-US';
    } else if (locale === 'en' && fs.existsSync(path.join(__dirname, 'locales', 'en.json'))) {
        locale = 'en';
    } else {
      locale = 'de-DE';
    }
  }

  try {
    const renderedHtml = renderTemplate(path.join(__dirname, "public", "index.template.html"), locale);
    res.send(renderedHtml);
  } catch (error) {
    console.error("Error rendering landing page:", error);
    res.sendFile(path.join(__dirname, "public", "index.html"));
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

module.exports = app; // Nur die App exportieren
