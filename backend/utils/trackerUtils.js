// utils/trackerUtils.js

function validateInput(input) {
  return input ? parseFloat(input) : 0;
}

exports.calculateAge = (birthyear) => {
  const currentYear = new Date().getFullYear();
  return currentYear - birthyear;
};

exports.calculateCalories = (gender, weight, height, age, workHoursWeek, workHoursPAL, restHoursPAL = 1.2) => {
  // Validate inputs
  height = validateInput(height);
  weight = validateInput(weight);
  age = validateInput(age);
  workHoursWeek = validateInput(workHoursWeek);
  workHoursPAL = validateInput(workHoursPAL);
  restHoursPAL = validateInput(restHoursPAL);

  // Calculate Basal Metabolic Rate (BMR) using the Mifflin-St Jeor Equation
  let bmr;
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // Calculate average daily work hours and rest hours
  const dailyWorkHours = workHoursWeek / 7;
  const dailyRestHours = 24 - dailyWorkHours;

  // Compute energy expenditure per hour based on BMR at rest
  const baseEnergyPerHour = bmr / 24;

  // For work hours, apply the work-specific PAL; for non-work hours, the rest-specific PAL.
  // This yields the exact daily energy expenditure as a weighted sum.
  const workHoursCalories = baseEnergyPerHour * dailyWorkHours * workHoursPAL;
  const restHoursCalories = baseEnergyPerHour * dailyRestHours * restHoursPAL;

  const totalDailyCalories = workHoursCalories + restHoursCalories;

  return {
    bmr: Math.round(bmr),
    workHoursCalories: Math.round(workHoursCalories),
    restHoursCalories: Math.round(restHoursCalories),
    totalDailyCalories: Math.round(totalDailyCalories),
  };
};

exports.calculateNutrientDistribution = (calories, nutritionType) => {
  let nutrientDistribution = {};

  if (nutritionType === "lowCarb") {
    nutrientDistribution.carbohydrates = (0.2 * calories) / 4; // 20% Kohlenhydrate
    nutrientDistribution.protein = (0.3 * calories) / 4; // 30% Protein
    nutrientDistribution.fat = (0.5 * calories) / 9; // 50% Fett
  } else if (nutritionType === "balanced") {
    nutrientDistribution.carbohydrates = (0.5 * calories) / 4; // 50% Kohlenhydrate
    nutrientDistribution.protein = (0.2 * calories) / 4; // 20% Protein
    nutrientDistribution.fat = (0.3 * calories) / 9; // 30% Fett
  } else if (nutritionType === "lowFat") {
    nutrientDistribution.carbohydrates = (0.6 * calories) / 4; // 60% Kohlenhydrate
    nutrientDistribution.protein = (0.2 * calories) / 4; // 20% Protein
    nutrientDistribution.fat = (0.2 * calories) / 9; // 20% Fett
  } else {
    return "Invalid nutrition type.";
  }

  nutrientDistribution.carbohydrates = Math.round(nutrientDistribution.carbohydrates);
  nutrientDistribution.protein = Math.round(nutrientDistribution.protein);
  nutrientDistribution.fat = Math.round(nutrientDistribution.fat);

  return nutrientDistribution;
};

exports.calculateDietCalories = (calories, dietLevel) => {
  let multiplier;

  switch (dietLevel) {
    case "strongLose":
      multiplier = 0.75; // 25% Kaloriendefizit
      break;
    case "lose":
      multiplier = 0.85; // 15% Kaloriendefizit
      break;
    case "maintain":
      multiplier = 1; // Erhaltungskalorien
      break;
    case "gain":
      multiplier = 1.1; // 10% Kalorienüberschuss
      break;
    case "strongGain":
      multiplier = 1.2; // 20% Kalorienüberschuss
      break;
    default:
      multiplier = 1;
      break;
  }

  const dietCalories = Math.round(calories * multiplier);

  return dietCalories;
};

exports.calculateFoodItemsTotals = (foodItems) => {
  // Wenn foodItems kein Array ist, mache es zu einem Array
  if (!Array.isArray(foodItems)) {
    foodItems = [foodItems];
  }

  // Initialisiere die Totals
  const totals = {
    kcal: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
  };

  // Berechne die Summe der Nährwerte
  foodItems.forEach((item) => {
    totals.kcal += item.kcal || 0;
    totals.protein += item.protein || 0;
    totals.carbohydrates += item.carbohydrates || 0;
    totals.fat += item.fat || 0;
  });

  // Runde alle Werte auf ganze Zahlen
  totals.kcal = Math.round(totals.kcal);
  totals.protein = Math.round(totals.protein);
  totals.carbohydrates = Math.round(totals.carbohydrates);
  totals.fat = Math.round(totals.fat);
  return totals;
};
