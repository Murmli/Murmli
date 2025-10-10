exports.marketCategoryRules = (outputFormat) => {
  const categories = {
    0: "Vegetables", // Gemüse
    1: "Bakery", // Backwaren
    2: "Beverages", // Getränke
    3: "Fruits", // Obst
    4: "Nuts", // Nüsse
    5: "Dairy Products", // Milchprodukte
    6: "Frozen Foods", // Tiefkühlprodukte
    7: "Pasta, Rice & Grains", // Nudeln, Reis & Teigwaren
    8: "Baking & Cooking", // Backen & Kochen
    9: "Broths & Sauces", // Brühen & Soßen
    10: "Meat & Fish", // Fleisch & Fisch
    11: "Canned Goods", // Konserven
    12: "Cereals", // Müsli
    13: "Cornflakes & Cereals", // Cornflakes & Cerealien
    14: "Miscellaneous", // Sonstige
    15: "Spices", // Gewürze
    16: "Vinegar & Oils", // Essig & Öle
    17: "Snacks", // Snacks
    18: "Refrigerated Section", // Kühlregal
    19: "Sweets", // Süßigkeiten
    20: "Household Items", // Haushaltswaren
    21: "Personal Care Products", // Körperpflegeprodukte
    22: "Pet Food", // Tiernahrung
  };

  if (outputFormat === "array") {
    return Object.values(categories);
  }
  if (outputFormat === "string") {
    return Object.values(categories).join(", ");
  }
  if (outputFormat === "json") {
    const json = JSON.stringify(categories, null, 2);
    return json.replace(/[\r\n]+/g, " ");

  }
  if (outputFormat === "object") {
    return categories;
  }
  if (outputFormat === "keys") {
    return Object.keys(categories).map(Number);
  }
  if (outputFormat === "length") {
    return Object.keys(categories).length;
  }

  return false;
};

exports.unitRules = (outputFormat) => {
  const units = {
    0: "g",      // gram
    1: "kg",     // kilogram
    2: "can",    // can
    3: "l",      // liter
    4: "ml",     // milliliter
    5: "cup",    // cup
    6: "clove",  // clove
    7: "pc",     // piece
    8: "breeze", // breeze (keine bekannte Kurzform, bleibt wie es ist)
    9: "tbsp",   // tablespoon
    10: "tsp",   // teaspoon
    11: null,    // keine Einheit
  };


  if (outputFormat === "array") {
    return Object.values(units);
  }
  if (outputFormat === "string") {
    return Object.values(units)
      .map((unit) => (unit === null ? null : `"${unit}"`))
      .join(", ");
  }
  if (outputFormat === "json") {
    const json = JSON.stringify(units, null, 2);
    return json.replace(/[\r\n]+/g, " ");
  }
  if (outputFormat === "object") {
    return units;
  }

  return false;
};

exports.seasonRules = (outputFormat) => {
  const seasons = {
    0: "Year-round",  // ganzjährig
    1: "Spring",      // Frühling
    2: "Summer",      // Sommer
    3: "Autumn",      // Herbst
    4: "Winter",      // Winter
  };

  if (outputFormat === "array") {
    return Object.values(seasons);
  }
  if (outputFormat === "string") {
    return Object.values(seasons).join(", ");
  }
  if (outputFormat === "json") {
    return JSON.stringify(seasons, null, 2);
  }
  if (outputFormat === "object") {
    return seasons;
  }
  if (outputFormat === "keys") {
    return Object.keys(seasons).map(Number);
  }
  if (outputFormat === "length") {
    return Object.keys(seasons).length;
  }

  return false;
};

exports.roundingRules = (outputFormat) => {
  const roundings = {
    gram: 10,
    kilogram: 0.01,
    can: 0.5,
    liter: 0.1,
    milliliter: 10,
    cup: 0.25,
    clove: 1,
    toe: 1,
    piece: 1,
    breeze: 1,
    tablespoon: 0.5,
    teaspoon: 0.5,
  };

  if (outputFormat === "array") {
    return Object.values(roundings);
  }
  if (outputFormat === "string") {
    return Object.values(roundings).join(", ");
  }
  if (outputFormat === "json") {
    return JSON.stringify(roundings, null, 2);
  }
  if (outputFormat === "object") {
    return roundings;
  }
  if (outputFormat === "keys") {
    return Object.keys(roundings).map(Number);
  }
  if (outputFormat === "length") {
    return Object.keys(roundings).length;
  }

  return false;
};
