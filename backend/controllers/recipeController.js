const Recipe = require("../models/recipeModel.js");
const UserRecipe = require("../models/userRecipeModel.js");
const Feedback = require("../models/feedbackModel.js");
const { translateRecipes, translateString } = require(`../utils/translator.js`);
const { createRecipe, scaleRecipe } = require(`../utils/recipeUtils.js`);
const { editRecipeWithLLM } = require("../utils/llm.js");

const fs = require("fs");
const PDFDocument = require("pdfkit");

exports.readRecipe = async (req, res) => {
  try {
    const recipeId = req.body.recipeId;
    const servings = req.body.servings || 4;

    if (!recipeId) {
      return res.status(400).json({ error: "Recipe ID is required" });
    }

    const [systemRecipe, userRecipe] = await Promise.all([
      Recipe.findById(recipeId).lean(),
      UserRecipe.findById(recipeId).lean()
    ]);

    const recipe = systemRecipe || userRecipe;  // Nutze das erste gefundene Rezept

    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    const translatedRecipe = await translateRecipes([recipe], req.user.language);

    const scaledRecipe = scaleRecipe(translatedRecipe[0], servings || 4);

    scaledRecipe.scaled = !!servings;

    return res.status(200).json(scaledRecipe);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.createUserRecipe = async (req, res) => {
  try {
    const user = req.user;
    const file = req.file ? req.file : false;
    const text = req.body.text;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    // Send immediate response that recipe creation has started
    res.status(202).json({ message: "Recipe creation started", status: "processing" });

    // Continue processing asynchronously
    (async () => {
      try {
        const randomRecipes = await UserRecipe.aggregate([{ $sample: { size: 5 } }]);
        const exclude = randomRecipes.map((recipe) => recipe.title).join(", ");
        const userInformations = {
          country: user.language,
          filter: user.suggestions?.filter?.prompt || '',
          favoriteRecipes: [],
          dietLevel: user.dietLevel,
          dietType: user.dietType
        };

        // If user has favorite recipes, get their titles
        if (user.favoriteRecipes && user.favoriteRecipes.length > 0) {
          const favoriteRecipeDetails = await Recipe.find(
            { _id: { $in: user.favoriteRecipes } },
            { title: 1 }
          ).lean();

          userInformations.favoriteRecipes = favoriteRecipeDetails.map(recipe => recipe.title);
        }

        const userRecipe = await createRecipe(text, { inputImage: file, exclude, informationObject: userInformations });

        if (req.file) {
          fs.unlink(req.file.path, (err) => {
            if (err) {
              console.error("Error deleting temporary file:", err);
            }
          });
        }

        userRecipe.userId = user._id;
        const recipe = new UserRecipe(userRecipe);
        const savedRecipe = await recipe.save();

        if (savedRecipe) {
          user.generations.push({
            recipeId: savedRecipe._id,
            createdAt: new Date(),
          });
          await user.save();
          console.log(`Recipe ${savedRecipe._id} created successfully for user ${user._id}`);
        } else {
          console.error("Failed to create recipe");
        }
      } catch (err) {
        console.error("Error in async recipe creation:", err);

        if (typeof userRecipe !== 'undefined') {
          console.dir(userRecipe, { depth: null });
        }
      }
    })();

  } catch (err) {
    console.error("Error initiating recipe creation:", err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.getUserRecipes = async (req, res) => {
  try {
    const user = req.user;
    const recipes = await UserRecipe.find({ userId: user._id });
    if (!recipes || recipes.length === 0) {
      return res.status(200).json({ recipes: [] });
    }

    const translatedRecipes = await translateRecipes(recipes, req.user.language);

    return res.status(200).json({ recipes: translatedRecipes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.getUserRecipeCount = async (req, res) => {
  try {
    const count = await UserRecipe.countDocuments({ userId: req.user._id });
    return res.status(200).json({ count });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.readUserRecipes = async (req, res) => {
  try {
    const user = req.user;
    const recipeId = req.body.recipeId;

    if (!recipeId) {
      return res.status(400).json({ error: "Recipe ID is required" });
    }

    const recipe = await UserRecipe.findOne({ _id: recipeId, user: user._id });

    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found for this user" });
    }

    const translatedRecipe = await translateRecipes([recipe], req.user.language);

    return res.status(200).json(translatedRecipe[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.deleteUserRecipe = async (req, res) => {
  try {
    const user = req.user;
    const recipeId = req.body.recipeId;

    if (!recipeId) {
      return res.status(400).json({ error: "Recipe ID is required" });
    }

    const recipe = await UserRecipe.findOneAndDelete({ _id: recipeId, userId: user._id });

    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found for this user" });
    }

    return res.status(200).json({ message: "Recipe successfully deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.createFeedback = async (req, res) => {
  try {
    const user = req.user;
    const recipeId = req.body.recipeId;

    if (!recipeId) {
      return res.status(400).json({ error: "Recipe ID is required" });
    }

    const recipe = await Recipe.findOne({ _id: recipeId });

    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found for this user" });
    }

    const feedback = new Feedback({
      content: req.body.content,
      recipe: recipeId,
      user: user._id,
    });

    const savedFeedback = await feedback.save();

    if (savedFeedback) {
      return res.status(201).json(savedFeedback);
    } else {
      return res.status(400).json({ error: "Failed to create feedback" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.createFavorite = async (req, res) => {
  try {
    const user = req.user;
    const recipeId = req.body.recipeId;

    if (!recipeId) {
      return res.status(400).json({ error: "Recipe ID is required" });
    }

    const recipe = await Recipe.findOne({ _id: recipeId });

    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found for this user" });
    }

    if (!user.favoriteRecipes.includes(recipeId)) {
      user.favoriteRecipes.push(recipeId);
      await req.user.save();
    }

    return res.status(201).json({ message: "Favorite recipe added successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.deleteFavorite = async (req, res) => {
  try {
    const user = req.user;
    const recipeId = req.body.recipeId;

    if (!recipeId) {
      return res.status(400).json({ error: "Recipe ID is required" });
    }

    user.favoriteRecipes = user.favoriteRecipes.filter((id) => id !== recipeId);
    await req.user.save();
    return this.readFavorite(req, res);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.readFavorite = async (req, res) => {
  try {
    const user = req.user;
    const count = parseInt(req.query.count);

    let favoriteRecipes = user.favoriteRecipes;

    if (!isNaN(count) && count > 0 && count < favoriteRecipes.length) {
      favoriteRecipes = favoriteRecipes.sort(() => 0.5 - Math.random()).slice(0, count);
    }

    const recipes = await Recipe.find({ _id: { $in: favoriteRecipes } }).lean();

    const sortedRecipes = favoriteRecipes.map((id) => {
      const recipe = recipes.find((r) => r._id.toString() === id);
      if (recipe) {
        recipe.isFavorite = true;
      }
      return recipe;
    });

    const translated = await translateRecipes(sortedRecipes, req.user.language);

    return res.status(200).json({ favoriteRecipes: translated });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.editTextUserRecipe = async (req, res) => {
  const { text, preview, updatedRecipe } = req.body;
  if (!text && !updatedRecipe) {
    return res.status(400).json({ message: "Missing text input or recipe" });
  }

  try {
    const recipe = await UserRecipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    if (!recipe.userId.equals(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    let updatedRecipeData;
    let changeSummary = [];

    if (updatedRecipe) {
      updatedRecipeData = updatedRecipe;
    } else {
      const llmResult = await editRecipeWithLLM(
        recipe.toObject(),
        text,
        req.user.language
      );

      if (!llmResult) {
        return res.status(500).json({ message: "LLM did not return a response" });
      }
      updatedRecipeData = llmResult.updatedRecipeData;
      changeSummary = llmResult.changeSummary;
    }

    updatedRecipeData.userId = req.user._id;

    if (preview) {
      const translated = await translateRecipes([updatedRecipeData], req.user.language);
      return res.status(200).json({ preview: translated[0], changes: changeSummary });
    }

    // normalize units back to ids
    updatedRecipeData.ingredients = updatedRecipeData.ingredients.map((ing) => ({
      ...ing,
      unit: typeof ing.unit === "object" ? ing.unit.id : ing.unit,
    }));

    updatedRecipeData.steps = updatedRecipeData.steps.map((step) => ({
      ...step,
      head: (step.head || []).map((h) => ({
        ...h,
        unit: typeof h.unit === "object" ? h.unit.id : h.unit,
      })),
    }));

    const updatedRecipeDoc = await UserRecipe.findByIdAndUpdate(
      req.params.id,
      updatedRecipeData,
      { new: true, runValidators: true }
    );

    const translated = await translateRecipes([updatedRecipeDoc.toObject()], req.user.language);
    res.json(translated[0]);
  } catch (error) {
    console.error("Error editing recipe with LLM:", error.message);
    res.status(500).json({ message: "Error editing recipe", error: error.message });
  }
};

exports.editTextRecipe = async (req, res) => {
  const { text, preview, updatedRecipe } = req.body;
  if (!text && !updatedRecipe) {
    return res.status(400).json({ message: "Missing text input or recipe" });
  }

  if (req.user.role !== "administrator") {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    let updatedRecipeData;
    let changeSummary = [];

    if (updatedRecipe) {
      updatedRecipeData = updatedRecipe;
    } else {
      const llmResult = await editRecipeWithLLM(
        recipe.toObject(),
        text,
        req.user.language
      );

      if (!llmResult) {
        return res.status(500).json({ message: "LLM did not return a response" });
      }
      updatedRecipeData = llmResult.updatedRecipeData;
      changeSummary = llmResult.changeSummary;
    }

    if (preview) {
      const translated = await translateRecipes([updatedRecipeData], req.user.language);
      return res.status(200).json({ preview: translated[0], changes: changeSummary });
    }

    // normalize units back to ids
    updatedRecipeData.ingredients = updatedRecipeData.ingredients.map((ing) => ({
      ...ing,
      unit: typeof ing.unit === "object" ? ing.unit.id : ing.unit,
    }));

    updatedRecipeData.steps = updatedRecipeData.steps.map((step) => ({
      ...step,
      head: (step.head || []).map((h) => ({
        ...h,
        unit: typeof h.unit === "object" ? h.unit.id : h.unit,
      })),
    }));

    const updatedRecipeDoc = await Recipe.findByIdAndUpdate(
      req.params.id,
      updatedRecipeData,
      { new: true, runValidators: true }
    );

    const translated = await translateRecipes([updatedRecipeDoc.toObject()], req.user.language);
    res.json(translated[0]);
  } catch (error) {
    console.error("Error editing recipe with LLM:", error.message);
    res.status(500).json({ message: "Error editing recipe", error: error.message });
  }
};

exports.downloadRecipePDF = async (req, res) => {
  try {
    const recipeId = req.body.recipeId;
    const servings = req.body.servings || 4;

    if (!recipeId) {
      return res.status(400).json({ error: "Recipe ID is required" });
    }

    const [systemRecipe, userRecipe] = await Promise.all([
      Recipe.findById(recipeId).lean(),
      UserRecipe.findById(recipeId).lean(),
    ]);

    const recipe = systemRecipe || userRecipe;

    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    const translatedRecipe = await translateRecipes([recipe], req.user.language);
    const scaledRecipe = scaleRecipe(translatedRecipe[0], servings);

    const [
      servingsLabel,
      ingredientsLabel,
      stepsLabel,
      stepLabel,
      nutrientsLabel,
      kcalLabel,
      carbsLabel,
      fatLabel,
      proteinLabel,
    ] = await Promise.all([
      translateString("Servings", req.user.language),
      translateString("Ingredients", req.user.language),
      translateString("Steps", req.user.language),
      translateString("Step", req.user.language),
      translateString("Nutritional Values per Portion", req.user.language),
      translateString("kCal", req.user.language),
      translateString("Carbs", req.user.language),
      translateString("Fat", req.user.language),
      translateString("Protein", req.user.language),
    ]);

    const doc = new PDFDocument({ size: "A4", margin: 30, autoFirstPage: true });

    const endOfPageY = doc.page.height - doc.page.margins.bottom;
    const safeText = (text, options = {}) => {
      if (doc.y > endOfPageY - 12) return;
      doc.text(text, options);
    };

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${scaledRecipe.title.replace(/\s+/g, "_")}.pdf"`
    );

    doc.pipe(res);

    doc.fontSize(18);
    safeText(scaledRecipe.title, { align: "center" });
    doc.moveDown();
    doc.fontSize(10);
    safeText(`${servingsLabel}: ${scaledRecipe.servings}`, { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    safeText(ingredientsLabel, { underline: true });
    scaledRecipe.ingredients.forEach((ing) => {
      const qty = ing.quantity !== null ? `${ing.quantity} ${ing.unit.name || ""}` : "";
      doc.fontSize(9);
      safeText(`- ${ing.name} ${qty}`);
    });
    doc.moveDown();

    doc.fontSize(12);
    safeText(stepsLabel, { underline: true });
    scaledRecipe.steps.forEach((step, i) => {
      doc.moveDown(0.5);
      doc.fontSize(10);
      safeText(`${stepLabel} ${i + 1}: ${step.name}`, { underline: true });

      if (step.head && step.head.length > 0) {
        step.head.forEach((item) => {
          const headQty = item.quantity !== null ? ` ${item.quantity} ${item.unit.name || ""}` : "";
          doc.fontSize(9);
          safeText(`- ${item.name}${headQty}`, { indent: 10 });
        });
      }

      const cleanContent = step.content.replace(/\n+/g, " ").trim();
      doc.fontSize(9);
      safeText(cleanContent, { indent: 10 });
      doc.moveDown(0.5);
    });

    doc.moveDown();
    doc.fontSize(12);
    safeText(nutrientsLabel, { underline: true });
    doc.fontSize(9);
    safeText(`${kcalLabel}: ${scaledRecipe.nutrients.kilocalories}`);
    safeText(`${carbsLabel}: ${scaledRecipe.nutrients.carbohydrates}`);
    safeText(`${fatLabel}: ${scaledRecipe.nutrients.fat}`);
    safeText(`${proteinLabel}: ${scaledRecipe.nutrients.protein}`);

    doc.end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.downloadSelectedRecipesPDF = async (req, res) => {
  try {
    const recipes = Array.isArray(req.body.recipes) ? req.body.recipes : [];

    if (recipes.length === 0) {
      return res.status(400).json({ error: "Recipes are required" });
    }

    const recipeDocs = await Promise.all(
      recipes.map(async (r) => {
        const [systemRecipe, userRecipe] = await Promise.all([
          Recipe.findById(r.recipeId).lean(),
          UserRecipe.findById(r.recipeId).lean(),
        ]);
        return systemRecipe || userRecipe || null;
      })
    );

    const validRecipes = recipeDocs.filter((r) => r);
    if (validRecipes.length === 0) {
      return res.status(404).json({ error: "Recipes not found" });
    }

    const translatedRecipes = await translateRecipes(
      validRecipes,
      req.user.language
    );

    const scaledRecipes = translatedRecipes.map((recipe, idx) =>
      scaleRecipe(recipe, recipes[idx].servings || recipe.servings)
    );

    const [
      servingsLabel,
      ingredientsLabel,
      stepsLabel,
      stepLabel,
      nutrientsLabel,
      kcalLabel,
      carbsLabel,
      fatLabel,
      proteinLabel,
    ] = await Promise.all([
      translateString("Servings", req.user.language),
      translateString("Ingredients", req.user.language),
      translateString("Steps", req.user.language),
      translateString("Step", req.user.language),
      translateString("Nutritional Values per Portion", req.user.language),
      translateString("kCal", req.user.language),
      translateString("Carbs", req.user.language),
      translateString("Fat", req.user.language),
      translateString("Protein", req.user.language),
    ]);

    const doc = new PDFDocument({ size: "A4", margin: 30, autoFirstPage: false });

    const endOfPageY = () => doc.page.height - doc.page.margins.bottom;
    const safeText = (text, options = {}) => {
      if (doc.y > endOfPageY() - 12) return;
      doc.text(text, options);
    };

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="recipes.pdf"`
    );

    doc.pipe(res);

    scaledRecipes.forEach((r, index) => {
      doc.addPage();

      doc.fontSize(18);
      safeText(r.title, { align: "center" });
      doc.moveDown();
      doc.fontSize(10);
      safeText(`${servingsLabel}: ${r.servings}`, { align: "center" });
      doc.moveDown();

      doc.fontSize(12);
      safeText(ingredientsLabel, { underline: true });
      r.ingredients.forEach((ing) => {
        const qty =
          ing.quantity !== null ? `${ing.quantity} ${ing.unit.name || ""}` : "";
        doc.fontSize(9);
        safeText(`- ${ing.name} ${qty}`);
      });
      doc.moveDown();

      doc.fontSize(12);
      safeText(stepsLabel, { underline: true });
      r.steps.forEach((step, i) => {
        doc.moveDown(0.5);
        doc.fontSize(10);
        safeText(`${stepLabel} ${i + 1}: ${step.name}`, { underline: true });

        if (step.head && step.head.length > 0) {
          step.head.forEach((item) => {
            const headQty =
              item.quantity !== null
                ? ` ${item.quantity} ${item.unit.name || ""}`
                : "";
            doc.fontSize(9);
            safeText(`- ${item.name}${headQty}`, { indent: 10 });
          });
        }

        const cleanContent = step.content.replace(/\n+/g, " ").trim();
        doc.fontSize(9);
        safeText(cleanContent, { indent: 10 });
        doc.moveDown(0.5);
      });

      doc.moveDown();
      doc.fontSize(12);
      safeText(nutrientsLabel, { underline: true });
      doc.fontSize(9);
      safeText(`${kcalLabel}: ${r.nutrients.kilocalories}`);
      safeText(`${carbsLabel}: ${r.nutrients.carbohydrates}`);
      safeText(`${fatLabel}: ${r.nutrients.fat}`);
      safeText(`${proteinLabel}: ${r.nutrients.protein}`);
    });

    doc.end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};
