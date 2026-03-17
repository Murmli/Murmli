require('dotenv').config();
const mongoose = require('mongoose');
const Recipe = require('../models/recipeModel');
const { createRecipe } = require('../utils/recipeUtils');

/**
 * Script to refresh and improve recipes in the database using the latest LLM logic.
 * Usage: node refreshRecipes.js [limit] [days] [updateImage]
 * limit: Number of recipes to process (0 for all)
 * days: Process recipes older than this many days (0 for all)
 * updateImage: 1 to generate a new image, 0 to keep the old one
 */
async function run() {
    const limitArg = process.argv[2];
    const daysArg = process.argv[3];
    const imageArg = process.argv[4];
    
    const limit = limitArg !== undefined ? parseInt(limitArg) : 0;
    const days = daysArg !== undefined ? parseInt(daysArg) : 0;
    const updateImage = imageArg === '1' || imageArg === 'true';
    
    console.log(`--- Recipe Refresh Script ---`);
    console.log(`Limit: ${limit === 0 ? 'Unlimited' : limit}`);
    console.log(`Age (older than days): ${days === 0 ? 'All' : days}`);
    console.log(`Update Images: ${updateImage ? 'YES' : 'NO'}`);
    console.log(`-----------------------------`);

    try {
        if (!process.env.DB_STRING) {
            throw new Error("DB_STRING not found in environment variables");
        }

        await mongoose.connect(process.env.DB_STRING);
        console.log("Connected to MongoDB");

        let query = {};
        if (days > 0) {
            const date = new Date();
            date.setDate(date.getDate() - days);
            query.updatedAt = { $lt: date };
        }

        let cursor = Recipe.find(query).sort({ updatedAt: 1 });
        if (limit > 0) {
            cursor = cursor.limit(limit);
        }

        const recipeList = await cursor;
        console.log(`Found ${recipeList.length} recipes to process.`);

        let successCount = 0;
        let failCount = 0;

        for (const recipe of recipeList) {
            console.log(`\n[${successCount + failCount + 1}/${recipeList.length}] Processing: ${recipe.title} (${recipe._id})`);
            
            try {
                const currentRecipeData = recipe.toObject();
                // Clean up sensitive/internal fields for the prompt
                const cleanContext = { ...currentRecipeData };
                delete cleanContext._id;
                delete cleanContext.__v;
                delete cleanContext.createdAt;
                delete cleanContext.updatedAt;
                delete cleanContext.image; // Don't send old image URL to LLM

                const prompt = `eine AKTUALISIERUNG und VERBESSERUNG des folgenden bestehenden Rezepts nach deinen aktuellsten Standards:
                
                AKTUELLER STAND DES REZEPTS (JSON):
                ${JSON.stringify(cleanContext)}

                WICHTIGE ANWEISUNGEN FÜR DAS UPDATE:
                1. Behalte den Kern des Rezepts (Titel, Hauptzutaten) unbedingt bei.
                2. Optimiere die Nährwertangaben und Zutaten-Kategorien/Einheiten so präzise wie möglich.
                3. Strukturiere die Schritte exakt nach deinen Regeln (head-Array mit Mengen/Einheiten, KEINE Mengen im content, logische Abfolge).
                4. Falls das Rezept bereits in allen Punkten (Struktur, Nährwerte, Beschreibungen) deinen höchsten aktuellen Standards entspricht, gib es nahezu identisch zurück.
                5. Verbessere die 'imageDescription' für maximale Qualität bei der Bildgenerierung.
                `;

                // Use recipeUtils.createRecipe because it handles image generation and storage
                const updatedData = await createRecipe(prompt, { 
                    image: updateImage, 
                    servings: recipe.servings 
                });

                if (updatedData) {
                    const updatePayload = {
                        ...updatedData,
                        provider: process.env.LLM_PROVIDER || "openai",
                        ratings: recipe.ratings,
                        upvotes: recipe.upvotes,
                        downvotes: recipe.downvotes,
                    };

                    // If we didn't want a new image, preserve the old one
                    // (recipeUtils.createRecipe sets it to "dummy" if image is false)
                    if (!updateImage) {
                        updatePayload.image = recipe.image;
                    }

                    await Recipe.findByIdAndUpdate(recipe._id, updatePayload);
                    console.log(`✅ Successfully updated: ${recipe.title}${updateImage ? ' (with NEW image)' : ''}`);
                    successCount++;
                } else {
                    console.error(`❌ LLM returned no data for: ${recipe.title}`);
                    failCount++;
                }
            } catch (recipeError) {
                console.error(`❌ Error processing ${recipe.title}:`, recipeError.message);
                failCount++;
            }
        }

        console.log(`\n--- Finished ---`);
        console.log(`Success: ${successCount}`);
        console.log(`Failed: ${failCount}`);
        console.log(`----------------`);

    } catch (err) {
        console.error("FATAL ERROR:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

run();
