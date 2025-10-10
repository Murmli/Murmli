const { unitRules, marketCategoryRules } = require("./rules.js");
const { generateJsonTranslation, generateTranslation } = require(`./llm.js`);
const { languageMapRaw } = require("../languageMap.js");

const mapLang = (code) => languageMapRaw[code] || code;

exports.translateItems = async (items, outputLang) => {
  try {
    if (!outputLang) {
      throw new Error("outputLang is required");
    }
    const lang = mapLang(outputLang);
    const units = unitRules("json");
    const categories = marketCategoryRules("json");

    const translatedUnits = await generateJsonTranslation(units, lang);
    const translatedCategories = await generateJsonTranslation(categories, lang);

    const translatedItems = await Promise.all(
      items.map(async (item) => {
        const plainItem = item.toObject ? item.toObject() : item;

        // Translate the name of the item
        const translatedName = await generateTranslation(plainItem.name, lang);

        return {
          ...plainItem,
          name: translatedName || plainItem.name, // Fallback to original name if translation fails
          unit: {
            id: plainItem.unit,
            name: plainItem.quantity === null ? null : translatedUnits[plainItem.unit] || null,
          },
          category: {
            id: plainItem.category,
            name: translatedCategories[plainItem.category] || null,
          },
        };
      })
    );
    return translatedItems;
  } catch (error) {
    console.error(error);
    return false;
  }
};

exports.translateListCategories = async (categories, outputLang) => {
  try {
    if (!outputLang) {
      throw new Error("outputLang is required");
    }
    const lang = mapLang(outputLang);

    const allCategories = marketCategoryRules("object");

    const translatedCategories = await Promise.all(
      categories.map(async (categoryId) => {
        const categoryName = allCategories[categoryId];
        if (!categoryName) {
          throw new Error(`Category with ID ${categoryId} not found`);
        }
        const translatedName = await generateTranslation(categoryName, lang);
        return {
          id: categoryId,
          name: translatedName,
        };
      })
    );

    return translatedCategories;
  } catch (error) {
    console.error(error);
    return false;
  }
};

exports.translateRecipes = async (recipes, outputLang) => {
  const lang = mapLang(outputLang);
  const units = unitRules("json");
  const translatedUnits = await generateJsonTranslation(units, lang);

  const recipePromises = recipes.map(async (recipe) => {
    try {
      // Erstelle eine Kopie des Rezepts
      const translatedRecipe = JSON.parse(JSON.stringify(recipe));

      const translatedTitle = await generateTranslation(recipe.title, lang);
      const translatedDescriptionShort = await generateTranslation(recipe.descriptionShort, lang);

      if (translatedTitle === false || translatedDescriptionShort === false) {
        throw new Error("Translation failed for recipe title or description");
      }

      translatedRecipe.title = translatedTitle;
      translatedRecipe.descriptionShort = translatedDescriptionShort;

      // Übersetzen der Zutaten
      await Promise.all(
        translatedRecipe.ingredients.map(async (ingredient) => {
          const optionalInfo = 'Die Übersetzung ist bezogen auf eine Rezeptzutat';
          const translatedIngredientName = await generateTranslation(ingredient.name, lang, optionalInfo);

          if (translatedIngredientName === false) {
            throw new Error(`Translation failed for ingredient name (${ingredient.name})`);
          }

          // Erstelle ein neues Zutatobjekt
          const newIngredient = {
            ...ingredient,
            name: translatedIngredientName,
            unit: {
              id: ingredient.unit,
              name: translatedUnits[ingredient.unit] || ""
            }
          };

          // Ersetze das alte Objekt
          Object.assign(ingredient, newIngredient);
        })
      );

      // Übersetzen der Schritte und deren Überschriften
      await Promise.all(
        translatedRecipe.steps.map(async (step) => {
          const translatedStepName = await generateTranslation(step.name, lang);
          const translatedStepContent = await generateTranslation(step.content, lang);

          if (translatedStepName === false) {
            throw new Error("Translation failed for step name");
          }
          if (translatedStepContent === false) {
            throw new Error("Translation failed for step content");
          }

          let translatedHeads = [];
          if (step.head && step.head.length > 0) {
            translatedHeads = await Promise.all(
              step.head.map(async (heading) => {
                const translatedHeadingName = await generateTranslation(heading.name, lang);
                if (translatedHeadingName === false) {
                  throw new Error("Translation failed for heading name");
                }
                return {
                  ...heading,
                  name: translatedHeadingName,
                  unit: {
                    id: heading.unit,
                    name: translatedUnits[heading.unit] || ""
                  }
                };
              })
            );
          }

          // Erstelle ein neues Step-Objekt
          const newStep = {
            ...step,
            name: translatedStepName,
            content: translatedStepContent,
            head: translatedHeads
          };

          // Ersetze das alte Objekt
          Object.assign(step, newStep);
        })
      );

      return translatedRecipe;
    } catch (error) {
      console.error(`Error translating recipe: ${error.message}`);
      throw error;
    }
  });

  try {
    const translatedRecipes = await Promise.all(recipePromises);
    return translatedRecipes;
  } catch (error) {
    console.error(`Error in recipe translation process: ${error.message}`);
    return false;
  }
};

exports.translateString = async (string, outputLang) => {
  try {
    if (!outputLang) {
      throw new Error("outputLang is required");
    }
    const lang = mapLang(outputLang);
    const translated = await generateTranslation(string, lang);
    return translated;
  } catch (error) {
    console.error(error);
    return false;
  }
};
