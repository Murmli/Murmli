const recipe = require('./recipe.schema.js');

module.exports = {
    name: "create_recipe",
    strict: true,
    schema: {
        type: "object",
        properties: {
            imageDescription: {
                type: "string",
                description: "Detaillierte Bildbeschreibung für DALL-E, in Englisch. Beschreibe Anordnung, Farben, Hintergrund, Beleuchtung und Stimmung."
            },
            seoImageTitle: {
                type: "string",
                description: "SEO-Titel für das Bild ohne Dateiendung, Unterstriche statt Leerzeichen."
            },
            title: recipe.schema.properties.title,
            description: recipe.schema.properties.description,
            descriptionShort: recipe.schema.properties.descriptionShort,
            ingredients: recipe.schema.properties.ingredients,
            steps: recipe.schema.properties.steps,
            servings: recipe.schema.properties.servings,
            preparationTime: recipe.schema.properties.preparationTime,
            season: recipe.schema.properties.season,
            originCountry: {
                type: "string",
                description: "Zwei-Buchstaben-Ländercode (z.B. de, it, vn)."
            },
            type: recipe.schema.properties.type,
            lowcarb: { type: "boolean", description: "Low-Carb geeignet" },
            lowfat: { type: "boolean", description: "Fettarm" },
            vegetarian: recipe.schema.properties.vegetarian,
            vegan: recipe.schema.properties.vegan,
            glutenfree: recipe.schema.properties.glutenfree,
            lactosefree: recipe.schema.properties.lactosefree,
            healthRating: recipe.schema.properties.healthRating,
            difficultyRating: recipe.schema.properties.difficultyRating,
            priceRating: recipe.schema.properties.priceRating,
            sustainabilityRating: recipe.schema.properties.sustainabilityRating,
            everydayRating: recipe.schema.properties.everydayRating,
            nutrients: recipe.schema.properties.nutrients
        },
        required: [
            "imageDescription",
            "seoImageTitle",
            "title",
            "description",
            "descriptionShort",
            "ingredients",
            "steps",
            "servings",
            "preparationTime",
            "season",
            "originCountry",
            "type",
            "lowcarb",
            "lowfat",
            "vegetarian",
            "vegan",
            "glutenfree",
            "lactosefree",
            "healthRating",
            "difficultyRating",
            "priceRating",
            "sustainabilityRating",
            "everydayRating",
            "nutrients"
        ],
        additionalProperties: false
    }
};
