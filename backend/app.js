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

// Route to serve the landing page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
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

module.exports = app; // Nur die App exportieren
