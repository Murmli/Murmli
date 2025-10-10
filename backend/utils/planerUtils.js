exports.generateSearchFilter = (prompt) => {
  try {
    const lowercasePrompt = prompt.toLowerCase();
    let searchFilters = {
      difficultyRating: { $lte: 11 },
      priceRating: { $lte: 11 },
      season: null,
    };

    searchFilters.season = { $in: [null, getCurrentSeason()] };

    // Pre filter for mongoDB by userPrompt
    if (/\b(vegetarisc?h|veggie|vegetar\w+|fleischlos|pescetarier?|ohne? fleisch|ohne[nm]? tier\w* fleisch|ohne[nm]? tierische[nm]? zutaten|kein fleisch)\b/i.test(lowercasePrompt)) {
      searchFilters.vegetarian = true;
    }
    if (/\b(vegan|vegane[nr]?|vegane[nm]? (gerichte|rezepte|speisen)|ohne tierische[nm]? produkte|pflanzenbasiert|pflanzliche[nm]? ernährung|(ausschließlich|nur|rein) pflanzlich(e[nm]?| produkte|e[nm]? zutaten)|(?:nur|möchte|möchten) .*?(?:gerichte|rezepte|speisen).*? mit pflanzlichen produkten)\b/i.test(lowercasePrompt)) {
      searchFilters.vegan = true;
    }
    if (/\b(glutenfrei|gluten[-\s]?frei|ohne[nm]? gluten|glutenlose[nm]?|glutenfreie[nm]? (gerichte|rezepte|speisen))\b/i.test(lowercasePrompt)) {
      searchFilters.glutenfree = true;
    }
    if (/\b(laktosefrei|laktose[-\s]?frei|ohne[nm]? laktose|laktosefreie[nm]? (gerichte|rezepte|speisen)|ohne[nm]? milchprodukte|vertrage? keine? milch|keine? milch vertragen)\b/i.test(lowercasePrompt)) {
      searchFilters.lactosefree = true;
    }
    if (/\b(einfach[en]? rezept[en]?|leicht[e]?|leichte[nm]? (gerichte|rezepte|speisen)|keine[n]? anspruchsvollen?|unkompliziert[en]? (gerichte|rezepte|speisen)|rezepte? sollten? einfach zu kochen sein|einfach zu kochen|leicht zu kochen)\b/i.test(lowercasePrompt)) {
      searchFilters.difficultyRating.$lte = 5;
    }
    if (/\b(anspruchsvoll[en]?|schwer[e]?|kompliziert[en]?|fortgeschritten[en]?) (rezepte|gerichte|speisen)\b/i.test(lowercasePrompt)) {
      searchFilters.difficultyRating.$gt = 4;
    }
    if (/\b(günstig[en]? rezept[en]?|billig[en]?|preiswert[en]?|klein[em]? geldbeutel|nicht viel geld|kostengünstig[en]?|für studenten?|für studentin|studentenbudget) (gerichte|rezepte|speisen)|zeige mir günstige (rezepte|gerichte|speisen) an\b/i.test(lowercasePrompt)) {
      searchFilters.priceRating.$lte = 6;
    }
    if (/\b(low[-\s]?carb|low carb|wenig kohlenhydrate|kohlenhydratarm|ohne[nm]? kohlenhydrate|kohlenhydratreduziert|kohlenhydratvermindert|lowcarb|low karb|low karbs|lo carb|wenig kohlenhydarte|kohlenhydratem)\b/i.test(lowercasePrompt)) {
      searchFilters["nutrients.carbohydrates"] = { $lt: 20 };
    }
    if (/\b(low[-\s]?fat|low fat|fettarm|wenig fett|ohne[nm]? fett|fettreduziert|fettvermindert|fettbewusst|low fatte|low ft|fettarem|wenik fett|wenige ftte|ohme fett)\b/i.test(lowercasePrompt)) {
      searchFilters["nutrients.fat"] = { $lt: 20 };
    }
    if (/\b(kalorienarm|wenig kalorien|kalorienbewusst|unter \d+ kalorien|leichte mahlzeiten|diät|kalorienreduziert|kalorienvermindert|kalorienbewusst|kalorienreduktion|gewichtsverlust|abnehmen|abzunehmen|schlankmachend|kalorinenarm|klorienarm|wenik kalorien|wenige kalorin|kaloreinarm|abnehemn|kalorienam)\b/i.test(lowercasePrompt)) {
      searchFilters["nutrients.kilocalories"] = { $lt: 400 };
    }
    if (/\b(hoch[-\s]?protein|proteinreich|eiweißreich|hohe[nm]? eiweiß|hohe[nm]? protein|viel protein|viel eiweiß|proteinbetont|eiweißbetont|proteinhaltig|eiweißhaltig|proteinenhaltig|eiweisenhaltig|protenhaltig|eiweisenreich|protenreich|muskelaufbau|bodybuilding|fitness|krafttraining|stärkung|muskel|massezuwachs)\b/i.test(lowercasePrompt)) {
      searchFilters["nutrients.protein"] = { $gt: 30 };
    }
    if (/\b(gesund[e]?|nährstoffreich|vollwertig|ausgewogen|gesunde[nm]? (gerichte|rezepte|speisen)|gesundernährung|vitalstoffreich|nährstoffbetont|gesundheitsbewusst|gesundheitsfördernd|gesundheitsvorteil|gesundheitsbezogen)\b/i.test(lowercasePrompt)) {
      searchFilters.healthRating = { $gt: 6 };
    }
    if (/\b(schnell[e]?|rasch[e]?|flott[e]?|express|kurz|zügig|wenig zeit|unter \d+ minuten|einfache[n]?|schnelle[nm]? (gerichte|rezepte|speisen)|zeitersparn[i]?s|zeitsparend|zeitoptimiert|kurzzeitkochen|schnellgemacht|eilen|eilig|flink|fix|minimale (vorbereitungszeit|arbeit)|blitzrezepte|turbo|ohne (großen aufwand|viel mühe)|in nullkommanichts|im handumdrehen|unkompliziert|leicht|wenig aufwand|ohne viel aufwand|leicht gemacht|einfach gemacht)\b/i.test(lowercasePrompt)) {
      searchFilters.preparationTime = { $lt: 30 };
    }

    return searchFilters;
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
};

function getCurrentSeason() {
  const currentDate = new Date();
  const month = currentDate.getMonth();
  let season;

  if (month >= 2 && month <= 4) {
    season = "spring";
  } else if (month >= 5 && month <= 7) {
    season = "summer";
  } else if (month >= 8 && month <= 10) {
    season = "fall";
  } else {
    season = "winter";
  }

  return season;
}

/**
 * Ergänzt einen aktiven Trainingsplan um die aktuelle Woche.
 * Gibt eine Kopie des Plans als Plain Object zurück.
 * @param {Object|Document} plan - Trainingsplan (Mongoose-Dokument oder Plain Object)
 * @returns {Object} Kopie des Plans, ggf. ergänzt um currentWeek
 */
exports.addCurrentWeekIfActive = function (plan) {
  if (!plan) return plan;

  const plainPlan = (typeof plan.toObject === 'function') ? plan.toObject() : { ...plan };

  if (
    plainPlan.status === 'active' &&
    plainPlan.startDate
  ) {
    const startDate = new Date(plainPlan.startDate);
    const now = new Date();
    const diffDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    let currentWeek = Math.floor(diffDays / 7) + 1;

    if (currentWeek < 1) currentWeek = 1;

    return { ...plainPlan, currentWeek };
  } else {
    return plainPlan;
  }
};
