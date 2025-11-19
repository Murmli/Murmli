const Recipe = require("../models/recipeModel.js");
const UserRecipe = require("../models/userRecipeModel.js");

function slugify(value, fallback = "rezept") {
  if (!value) {
    return fallback;
  }

  const prepared = String(value)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return prepared || fallback;
}

function normaliseBaseUrl(rawBaseUrl) {
  const fallback = "http://localhost:8080";
  const base = rawBaseUrl || fallback;
  return base.replace(/\/+$/, "");
}

function formatDate(value) {
  if (!value) {
    return undefined;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

async function fetchRecipeDocuments() {
  const projection = { _id: 1, title: 1, updatedAt: 1, createdAt: 1 };
  const [systemRecipes, userRecipes] = await Promise.all([
    Recipe.find({ active: { $ne: false } }, projection).lean(),
    UserRecipe.find({ active: { $ne: false } }, projection).lean()
  ]);

  return { systemRecipes, userRecipes };
}

function buildRecipeUrls({ recipes, type, baseUrl }) {
  const priority = type === "system" ? "0.85" : "0.7";
  const changefreq = type === "system" ? "weekly" : "monthly";

  return recipes.map((recipe) => {
    const id = recipe._id.toString();
    const slug = slugify(recipe.title, `rezept-${id.slice(-6)}`);
    return {
      loc: `${baseUrl}/recipe/${slug}-${id}`,
      lastmod: formatDate(recipe.updatedAt || recipe.createdAt),
      changefreq,
      priority
    };
  });
}

function toUrlTag(entry) {
  const lastmod = entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>\n` : "";
  const changefreq = entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>\n` : "";
  const priority = entry.priority ? `    <priority>${entry.priority}</priority>\n` : "";

  return `<url>\n    <loc>${entry.loc}</loc>\n${lastmod}${changefreq}${priority}</url>`;
}

async function generateRecipeSitemap(rawBaseUrl) {
  const baseUrl = normaliseBaseUrl(rawBaseUrl);
  const { systemRecipes, userRecipes } = await fetchRecipeDocuments();

  const staticEntries = [
    {
      loc: `${baseUrl}/`,
      lastmod: new Date().toISOString(),
      changefreq: "weekly",
      priority: "1.0"
    },
    {
      loc: `${baseUrl}/datenschutz.html`,
      changefreq: "yearly",
      priority: "0.4"
    }
  ];

  const recipeEntries = [
    ...buildRecipeUrls({ recipes: systemRecipes, type: "system", baseUrl }),
    ...buildRecipeUrls({ recipes: userRecipes, type: "user", baseUrl })
  ];

  const xmlEntries = [...staticEntries, ...recipeEntries]
    .map(toUrlTag)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlEntries}\n</urlset>`;
}

module.exports = { generateRecipeSitemap };
