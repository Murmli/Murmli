// controllers/trackerController.js

const Tracker = require("../models/trackerModel.js");
const Recipe = require("../models/recipeModel.js");
const User = require("../models/userModel.js");
const UserRecipe = require("../models/userRecipeModel.js");
const { calculateAge, calculateCalories, calculateNutrientDistribution, calculateDietCalories, calculateFoodItemsTotals } = require(`../utils/trackerUtils.js`);

const { textToTrack, audioToTrack, imageToTrack, textToActivity, askCalorieTracker, chatWithTracker } = require(`../utils/llm.js`);
const fs = require("fs");

const bodyDataFields = ["height", "weight", "birthyear", "gender", "dietType", "dietLevel", "dietStartedAt", "baseCalories", "recommendations", "workHoursWeek", "workDaysPAL"];

async function getOrCreateTracker(userId, date, recommendations) {
  // Fetch user data with daily items
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  let tracker = await Tracker.findOne({ user: userId, date });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const requestedDate = new Date(date);
  requestedDate.setUTCHours(0, 0, 0, 0);

  const isToday = today.getTime() === requestedDate.getTime();

  if (!tracker) {
    tracker = new Tracker({
      user: userId,
      date,
      foodItems: [],
      recommendations,
      totals: {
        kcal: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0,
      },
    });

    // Only add daily items if date is today
    if (isToday && user.dailyFoodItems && user.dailyFoodItems.length > 0) {
      user.dailyFoodItems.forEach((item) => {
        tracker.foodItems.push(item);
      });

      const totals = calculateFoodItemsTotals(tracker.foodItems);
      tracker.totals = totals;
    }

    await tracker.save();
  } else {
    // Only add daily items if date is today and not already added
    const hasDailyItems = tracker.foodItems.some(item => item.daily === 1);

    if (isToday && !hasDailyItems && user.dailyFoodItems && user.dailyFoodItems.length > 0) {
      user.dailyFoodItems.forEach((item) => {
        tracker.foodItems.push(item);
      });

      const totals = calculateFoodItemsTotals(tracker.foodItems);
      tracker.totals = totals;

      await tracker.save();
    }
  }

  return tracker;
}


exports.getBodyData = async (req, res) => {
  try {
    const user = req.user;

    const bodyData = {};
    bodyDataFields.forEach((field) => {
      if (user[field] !== undefined) {
        bodyData[field] = user[field];
      }
    });

    // Retrieve the latest weight from weightTracking
    const latestWeight = user.weightTracking.length > 0 ? user.weightTracking[user.weightTracking.length - 1].weight : null;

    bodyData.latestWeight = latestWeight;

    if (Object.keys(bodyData).length === 0) {
      return res.status(404).json({ error: "No body data found for user" });
    }

    return res.status(200).json({ bodyData });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.updateBodyData = async (req, res) => {
  try {
    const user = req.user;
    const updateFields = {};

    // Check if weight is being updated
    if (req.body.weight !== undefined) {
      const newWeight = req.body.weight;

      // Add new weight entry to weightTracking array
      user.weightTracking.push({ weight: newWeight, timestamp: new Date() });
    }

    bodyDataFields.forEach((field) => {
      if (req.body[field] !== undefined && field !== "weight") {
        updateFields[field] = req.body[field];
      }
    });

    if (req.body.recommendations) {
      updateFields.recommendations = {};
      ["kcal", "protein", "carbohydrates", "fat"].forEach((nutrient) => {
        if (req.body.recommendations[nutrient] !== undefined) {
          updateFields.recommendations[nutrient] = req.body.recommendations[nutrient];
        }
      });
    }

    if (Object.keys(updateFields).length > 0) {
      await user.updateOne(updateFields, { new: true, runValidators: true });
    }

    // Update dietStartedAt if dietLevel is changed
    if (req.body.dietLevel !== undefined && req.body.dietLevel !== user.dietLevel) {
      user.dietStartedAt = new Date();
    }

    // Save the updated user data
    await user.save();

    return res.status(200).json({ message: "User data updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.calculateCalories = async (req, res) => {
  try {
    const { height, birthyear, gender, dietType, dietLevel, workHoursWeek, workDaysPAL } = req.user;
    const { saveCalculation = false } = req.body;

    // Überprüfen, ob ein Gewichtseintrag vorhanden ist
    if (!req.user.weightTracking || req.user.weightTracking.length === 0) {
      return res.status(400).json({ error: "No weight data available." });
    }

    // Verwende den letzten Gewichtseintrag
    const latestWeight = req.user.weightTracking[req.user.weightTracking.length - 1].weight;

    // Überprüfen, ob notwendige Daten vorhanden sind
    if (!height || !latestWeight || !birthyear || !gender || !workHoursWeek || !workDaysPAL) {
      return res.status(400).json({ error: "Height, weight, birthyear, gender, work hours and work days are required. " });
    }

    // Alter basierend auf dem Geburtsjahr berechnen
    const age = calculateAge(birthyear);

    // Basiskalorien berechnen
    const calculationDetails = calculateCalories(gender, latestWeight, height, age, workHoursWeek, workDaysPAL);

    if (!calculationDetails) {
      throw new Error("Error calculating calories. Please check the input data.", gender, latestWeight, height, age, workHoursWeek, workDaysPAL);
    }

    const baseCalories = calculationDetails.totalDailyCalories;
    const dietCalories = dietType ? calculateDietCalories(baseCalories, dietLevel) : baseCalories;
    const dietNutrient = calculateNutrientDistribution(dietCalories, dietType);
    const targetCalories = dietType ? dietCalories : baseCalories;

    // Benutzerinformationen aktualisieren
    req.user.recommendations = dietNutrient;
    req.user.recommendations.kcal = targetCalories;
    req.user.baseCalories = baseCalories;

    let message = "Calorie calculation successful";
    if (saveCalculation) {
      await req.user.save();
      message = "Calorie calculation successful and saved";
    }

    return res.status(200).json({
      baseCalories,
      recommendations: req.user.recommendations,
      calculationDetails,
      message,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

async function trackItems(user, trackerId, foodItems) {
  try {
    let tracker = await Tracker.findOne({ _id: trackerId, user: user._id });

    if (!tracker) {
      throw new Error("Tracker not found");
    }

    tracker.foodItems.push(...foodItems);

    const totals = calculateFoodItemsTotals(tracker.foodItems);
    tracker.totals = totals;

    await tracker.save();
    return tracker;
  }
  catch (error) {
    console.error(error);
    throw error;
  }
}

exports.trackText = async (req, res) => {
  try {
    const user = req.user;
    const { text, trackerId } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required." });
    }

    if (!trackerId) {
      return res.status(400).json({ error: "Tracker ID is required." });
    }

    const foodItems = await textToTrack(text, user.language);
    if (!foodItems || foodItems.length === 0) {
      return res.status(400).json({ error: "No valid food items found in the text." });
    }

    const tracker = await trackItems(user, trackerId, foodItems);

    return res.status(200).json({ message: "Food items tracked and totals updated successfully", tracker });
  } catch (err) {
    console.log(`Error in trackText: ${JSON.stringify(req.body)}`);
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.trackRecipe = async (req, res) => {
  try {
    const user = req.user;
    const { recipeId, portions, trackerId } = req.body;


    if (!recipeId || !portions || portions <= 0) {
      return res.status(400).json({ error: "Valid recipe ID and portions are required." });
    }

    if (!trackerId) {
      return res.status(400).json({ error: "Tracker ID is required." });
    }


    const [systemRecipe, userRecipe] = await Promise.all([
      Recipe.findById(recipeId).lean(),
      UserRecipe.findById(recipeId).lean()
    ]);

    const recipe = systemRecipe || userRecipe;  // Nutze das erste gefundene Rezept

    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found." });
    }

    const portionKcal = recipe.nutrients.kilocalories * portions;
    const portionProtein = recipe.nutrients.protein * portions;
    const portionCarbs = recipe.nutrients.carbohydrates * portions;
    const portionFat = recipe.nutrients.fat * portions;

    const recipeName = `${recipe.title.substring(0, 20)}...`;

    // Verwende die getOrCreateTracker Funktion
    let tracker = await Tracker.findOne({ _id: trackerId, user: user._id });

    const healthyRating = Math.round(recipe.healthRating / 2);

    const foodItem = {
      name: recipeName,
      amount: portions,
      unit: "Portion",
      kcal: portionKcal,
      protein: portionProtein,
      carbohydrates: portionCarbs,
      fat: portionFat,
      healthyRating: healthyRating,
    };

    tracker.foodItems.push(foodItem);

    const totals = calculateFoodItemsTotals(tracker.foodItems);
    tracker.totals = totals;

    await tracker.save();

    return res.status(200).json({ message: "Recipe tracked and totals updated successfully", tracker });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.getTrackerByDate = async (req, res) => {
  try {
    const user = req.user;
    const requestedDate = req.body.date ? new Date(req.body.date) : new Date(new Date().setUTCHours(0, 0, 0, 0));
    // Verwende die getOrCreateTracker Funktion
    let tracker = await getOrCreateTracker(user._id, requestedDate, req.user.recommendations);

    return res.status(200).json(tracker);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.setRecommendations = async (req, res) => {
  try {
    const user = req.user;

    const { trackerId, recommendations } = req.body;

    // Aktualisieren der vorhandenen Empfehlungen
    if (recommendations.kcal !== undefined) user.recommendations.kcal = recommendations.kcal;
    if (recommendations.protein !== undefined) user.recommendations.protein = recommendations.protein;
    if (recommendations.carbohydrates !== undefined) user.recommendations.carbohydrates = recommendations.carbohydrates;
    if (recommendations.fat !== undefined) user.recommendations.fat = recommendations.fat;

    // Speichern der aktualisierten Benutzerdaten
    await user.save();

    // lade Tracker und udpate
    let tracker = await Tracker.findOne({ _id: trackerId, user: user._id });
    if (tracker) {
      // Aktualisiere die Empfehlungen auch im Tracker
      if (recommendations.kcal !== undefined) tracker.recommendations.kcal = recommendations.kcal;
      if (recommendations.protein !== undefined) tracker.recommendations.protein = recommendations.protein;
      if (recommendations.carbohydrates !== undefined) tracker.recommendations.carbohydrates = recommendations.carbohydrates;
      if (recommendations.fat !== undefined) tracker.recommendations.fat = recommendations.fat;

      await tracker.save();
    }


    return res.status(200).json({ message: "Recommendations successfully updated", recommendations: user.recommendations });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.trackWeight = async (req, res) => {
  try {
    const user = req.user;
    const { weight } = req.body;

    if (!weight || isNaN(weight)) {
      return res.status(400).json({ error: "Valid weight is required." });
    }

    // Add new weight entry with timestamp
    user.weightTracking.push({ weight, timestamp: new Date() });
    // Save the updated user with new weight entry
    await user.save();

    return res.status(200).json({ message: "Weight tracked successfully", weight });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.trackActivity = async (req, res) => {
  try {
    const user = req.user;
    const { text, trackerId } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Activity text is required." });
    }

    if (!trackerId) {
      return res.status(400).json({ error: "Tracker ID is required." });
    }

    const latestWeightEntry = user.weightTracking.length > 0 ? user.weightTracking[user.weightTracking.length - 1].weight : null;

    if (!latestWeightEntry) {
      return res.status(400).json({ error: "No weight data available for this user." });
    }

    const activityResult = await textToActivity(text, user.gender, user.height, latestWeightEntry);
    if (!activityResult || activityResult.caloriesBurned === 0) {
      return res.status(400).json({ error: "Invalid activity or unable to calculate calories." });
    }

    let tracker = await Tracker.findOne({ _id: trackerId, user: user._id });

    tracker.recommendations.kcal += activityResult.caloriesBurned;

    tracker.activities.push({
      ...activityResult,
      timestamp: new Date()
    });

    await tracker.save();

    return res.status(200).json({
      message: "Activity tracked and calories added successfully",
      activityResult,
      tracker,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.removeActivity = async (req, res) => {
  try {
    const user = req.user;
    const { trackerId, activityId } = req.body;

    if (!activityId) {
      return res.status(400).json({ error: "Activity ID is required." });
    }

    let tracker = await Tracker.findOne({ _id: trackerId, user: user._id });

    if (!tracker) {
      return res.status(404).json({ error: "Tracker not found." });
    }

    // Find the activity by ID
    const activityIndex = tracker.activities.findIndex((activity) => activity._id.toString() === activityId);

    if (activityIndex === -1) {
      return res.status(404).json({ error: "Activity not found." });
    }

    // Get the calories burned by the activity to be removed
    const caloriesBurned = tracker.activities[activityIndex].caloriesBurned;

    // Remove the activity
    tracker.activities.splice(activityIndex, 1);

    // Adjust the recommendations by subtracting the calories burned
    tracker.recommendations.kcal -= caloriesBurned;

    await tracker.save();

    return res.status(200).json({
      message: "Activity removed successfully",
      tracker
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.updateActivity = async (req, res) => {
  try {
    const user = req.user;
    const { trackerId, activityId, name, duration, caloriesBurned } = req.body;

    if (!activityId) {
      return res.status(400).json({ error: "Activity ID is required." });
    }

    if (!trackerId) {
      return res.status(400).json({ error: "Tracker ID is required." });
    }

    let tracker = await Tracker.findOne({ _id: trackerId, user: user._id });

    if (!tracker) {
      return res.status(404).json({ error: "Tracker not found." });
    }

    // Finde die Aktivität anhand der activityId
    const activity = tracker.activities.id(activityId);

    if (!activity) {
      return res.status(404).json({ error: "Activity not found." });
    }

    // Speichere die ursprünglichen verbrannten Kalorien, um die Empfehlungen anzupassen
    const originalCaloriesBurned = Number(activity.caloriesBurned);

    // Aktualisiere die Felder, wenn sie im req.body enthalten sind
    if (name !== undefined) activity.name = name;
    if (duration !== undefined) activity.duration = duration;
    if (caloriesBurned !== undefined) {
      // Ensure both values are treated as numbers by explicitly converting them
      tracker.recommendations.kcal = Number(tracker.recommendations.kcal) - originalCaloriesBurned + Number(caloriesBurned);
      activity.caloriesBurned = Number(caloriesBurned);
    }

    await tracker.save();

    return res.status(200).json({
      message: "Activity updated successfully",
      activity,
      tracker
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.askQuestion = async (req, res) => {
  try {
    const user = req.user;
    const question = req.body.question;

    if (!question) {
      return res.status(400).json({ error: "A question is required." });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(today.getDate() - 14);

    // Get trackers for last 14 days
    const trackers = await Tracker.find({
      user: user._id,
      date: { $gte: fourteenDaysAgo, $lte: today }
    }).sort({ date: -1 }); // Sort by date descending (newest first)

    if (!trackers || trackers.length === 0) {
      return res.status(404).json({ error: "No trackers found for the last 14 days." });
    }

    const bodyData = {
      height: user.height,
      weight: user.weight,
      birthyear: user.birthyear,
      gender: user.gender,
    };

    const response = await askCalorieTracker(question, trackers, bodyData, user.language);

    return res.status(200).json({ answer: response });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.toggleFoodItemDaily = async (req, res) => {
  try {
    const user = req.user;
    const { trackerId, foodItemId } = req.body;

    if (!foodItemId) {
      return res.status(400).json({ error: "A Food Item ID is required." });
    }

    let tracker = await Tracker.findOne({ _id: trackerId, user: user._id });

    if (!tracker) {
      return res.status(404).json({ error: "No tracker found" });
    }

    // Find the food item by ID
    const foodItem = tracker.foodItems.id(foodItemId);
    if (!foodItem) {
      return res.status(404).json({ error: "Food item not found" });
    }

    // Toggle the daily status
    const newDailyStatus = foodItem.daily === 1 ? 0 : 1;
    foodItem.daily = newDailyStatus;

    // Wenn als täglich markiert, zum User-Modell hinzufügen
    if (newDailyStatus === 1) {
      // Prüfen, ob das Element bereits in den täglichen Elementen des Users existiert
      const existingItemIndex = user.dailyFoodItems.findIndex(
        item => item._id === foodItem._id
      );

      if (existingItemIndex === -1) {
        // Wenn nicht vorhanden, hinzufügen
        user.dailyFoodItems.push(foodItem);
      }
    } else {
      // Wenn nicht mehr täglich, aus dem User-Modell entfernen
      user.dailyFoodItems = user.dailyFoodItems.filter(
        item => !(item.name === foodItem.name &&
          item.amount === foodItem.amount &&
          item.unit === foodItem.unit)
      );
    }

    // Beide Dokumente speichern
    await Promise.all([tracker.save(), user.save()]);

    const status = newDailyStatus === 1 ? "marked as daily" : "unmarked as daily";
    return res.status(200).json({ message: `Food item ${status}`, tracker });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.trackImage = async (req, res) => {
  try {
    const user = req.user;
    const imageFile = req.file;
    const textComment = req.body.comment || ""; // Optionaler Textkommentar
    const trackerId = req.body.trackerId;

    if (!imageFile) {
      return res.status(400).json({ error: "An image is required." });
    }

    if (!trackerId) {
      return res.status(400).json({ error: "Tracker ID is required." });
    }

    const foodItems = await imageToTrack(imageFile, textComment, user.language);

    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error("Error deleting temporary file:", err);
        }
      });
    }

    if (!foodItems || foodItems.length === 0) {
      return res.status(400).json({ error: "No valid food items found in the image." });
    }

    let tracker = await Tracker.findOne({ _id: trackerId, user: user._id });

    if (!tracker) {
      return res.status(404).json({ error: "Tracker not found." });
    }

    tracker.foodItems.push(...foodItems);

    const totals = calculateFoodItemsTotals(tracker.foodItems);
    tracker.totals = totals;

    await tracker.save();

    return res.status(200).json({ message: "Food items tracked from image and totals updated successfully", tracker });
  } catch (err) {
    console.log(`Error in trackImage: ${JSON.stringify(req.body)}`);
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const user = req.user;
    const { trackerId, foodItemId } = req.body;

    if (!foodItemId) {
      return res.status(400).json({ error: "Item ID is required." });
    }

    let tracker = await Tracker.findOne({ _id: trackerId, user: user._id });

    // Finde das Item anhand der foodItemId
    const itemIndex = tracker.foodItems.findIndex((item) => item._id.toString() === foodItemId);

    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found." });
    }

    // Entferne das Item
    tracker.foodItems.splice(itemIndex, 1);

    // Berechne die neuen Totals
    const totals = calculateFoodItemsTotals(tracker.foodItems);
    tracker.totals = totals;

    await tracker.save();

    return res.status(200).json({ message: "Item removed successfully", tracker });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const user = req.user;
    const { trackerId, foodItemId, name, amount, unit, kcal, protein, carbohydrates, fat, healthyRating } = req.body;

    if (!foodItemId) {
      return res.status(400).json({ error: "Food Item ID is required." });
    }

    let tracker = await Tracker.findOne({ _id: trackerId, user: user._id });

    // Finde das Item anhand der foodItemId
    const foodItem = tracker.foodItems.id(foodItemId);

    if (!foodItem) {
      return res.status(404).json({ error: "Item not found." });
    }

    // Aktualisiere die Felder, wenn sie im req.body enthalten sind
    if (name !== undefined) foodItem.name = name;
    if (amount !== undefined) foodItem.amount = amount;
    if (unit !== undefined) foodItem.unit = unit;
    if (kcal !== undefined) foodItem.kcal = kcal;
    if (protein !== undefined) foodItem.protein = protein;
    if (carbohydrates !== undefined) foodItem.carbohydrates = carbohydrates;
    if (fat !== undefined) foodItem.fat = fat;
    if (healthyRating !== undefined) foodItem.healthyRating = healthyRating;

    // Berechne die neuen Totals
    const totals = calculateFoodItemsTotals(tracker.foodItems);
    tracker.totals = totals;

    await tracker.save();

    return res.status(200).json({ message: "Item updated successfully", tracker });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.trackItemAudio = async (req, res) => {
  try {
    const user = req.user;
    const { trackerId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Audio file is required." });
    }

    if (!trackerId) {
      return res.status(400).json({ error: "Tracker ID is required." });
    }

    const foodItems = await audioToTrack(file, req.body.comment || "", user.language);

    if (!foodItems || foodItems.length === 0) {
      return res.status(400).json({ error: "No food items could be identified from the audio." });
    }

    const tracker = await trackItems(user, trackerId, foodItems);

    // Clean up temp file
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlink(file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    return res.status(200).json({ message: "Food items tracked from audio/video successfully", tracker });

  } catch (err) {
    console.log(`Error in trackItemAudio: ${JSON.stringify(req.body)}`);
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.addItemToToday = async (req, res) => {
  try {
    const user = req.user;
    const { sourceTrackerId, foodItemId } = req.body;

    if (!sourceTrackerId || !foodItemId) {
      return res.status(400).json({ error: "Tracker ID and Food Item ID are required." });
    }

    const sourceTracker = await Tracker.findOne({ _id: sourceTrackerId, user: user._id });
    if (!sourceTracker) {
      return res.status(404).json({ error: "Source tracker not found" });
    }

    const foodItem = sourceTracker.foodItems.id(foodItemId);
    if (!foodItem) {
      return res.status(404).json({ error: "Food item not found in source tracker" });
    }

    // Erstelle ein neues FoodItem-Objekt für den heutigen Tracker
    // Wichtig: Neue _id generieren, damit es ein eigenständiges Objekt ist
    const newFoodItem = {
      name: foodItem.name,
      amount: foodItem.amount,
      unit: foodItem.unit,
      kcal: foodItem.kcal,
      protein: foodItem.protein,
      carbohydrates: foodItem.carbohydrates,
      fat: foodItem.fat,
      healthyRating: foodItem.healthyRating,
      daily: 0 // Beim Kopieren standardmäßig nicht als daily markieren
    };

    // Tracker für heute abrufen oder erstellen
    const today = new Date();
    // getOrCreateTracker erwartet ein Datum-Objekt oder String
    let tracker = await getOrCreateTracker(user._id, today, user.recommendations);

    tracker.foodItems.push(newFoodItem);

    const totals = calculateFoodItemsTotals(tracker.foodItems);
    tracker.totals = totals;

    await tracker.save();

    return res.status(200).json({ message: "Food item added to today's tracker successfully", tracker });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.chat = async (req, res) => {
  try {
    const user = req.user;
    const { messages, trackerId } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    if (!trackerId) {
      return res.status(400).json({ error: "Tracker ID is required." });
    }

    let tracker = await Tracker.findOne({ _id: trackerId, user: user._id });

    if (!tracker) {
      return res.status(404).json({ error: "Tracker not found." });
    }

    const bodyData = {
      height: user.height,
      weight: user.weight,
      birthyear: user.birthyear,
      gender: user.gender,
      dietType: user.dietType,
      dietLevel: user.dietLevel,
      recommendations: user.recommendations
    };

    const response = await chatWithTracker(messages, tracker, bodyData, user.language);

    if (response) {
      return res.status(200).json({ answer: response });
    } else {
      return res.status(500).json({ error: "Failed to generate response." });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
};

