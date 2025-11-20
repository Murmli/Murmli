(function () {
  const placeholderImage = "/logos/murmli_logo_256.png";
  const heroTitleEl = document.getElementById("recipe-title");
  const heroDescriptionEl = document.getElementById("recipe-description");
  const heroImageEl = document.getElementById("recipe-image");
  const heroMetaEl = document.getElementById("recipe-meta");
  const dietTagsEl = document.getElementById("recipe-diet-tags");
  const recipeContentEl = document.getElementById("recipe-content");
  const canonicalLinkEl = document.getElementById("canonical-link");

  const urlParams = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const slugFragment = pathParts[pathParts.length - 1] || "";
  const slugParts = slugFragment.split('-');
  const recipeId = slugParts[slugParts.length - 1];
  const language = urlParams.get('lang') || 'de-DE';
  const servings = urlParams.get('servings') || 4;

  if (!recipeId) {
    showError("Rezept-ID nicht gefunden.");
    return;
  }

  loadRecipe(recipeId, { servings, language });

  async function loadRecipe(id, { servings, language }) {
    try {
      const query = new URLSearchParams({ servings, lang: language });
      const response = await fetch(`/api/v2/recipe/public/${id}?${query.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const recipe = await response.json();
      const currentUrl = window.location.href;

      updateMetaTags(recipe, currentUrl);
      renderRecipe(recipe);
      injectRecipeSchema(recipe, currentUrl);

      if (canonicalLinkEl) {
        canonicalLinkEl.setAttribute('href', currentUrl);
      }

      if (recipeContentEl) {
        recipeContentEl.setAttribute('aria-busy', 'false');
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
      showError('Fehler beim Laden des Rezepts. Bitte versuche es später erneut.');
    }
  }

  function showError(message) {
    if (recipeContentEl) {
      recipeContentEl.innerHTML = `<div class="recipe-card recipe-error"><p>${message}</p></div>`;
      recipeContentEl.setAttribute('aria-busy', 'false');
    }
    if (heroTitleEl) {
      heroTitleEl.textContent = 'Rezept nicht verfügbar';
    }
    if (heroDescriptionEl) {
      heroDescriptionEl.textContent = message;
    }
  }

  function renderRecipe(recipe) {
    if (!recipe) {
      showError('Rezeptdaten fehlen.');
      return;
    }

    const description = recipe.description || recipe.descriptionShort || `Entdecke das Rezept für ${recipe.title} mit Murmli!`;
    const metaChips = buildMetaChips(recipe);
    const dietTags = buildDietTags(recipe);
    const contentHTML = buildContent(recipe);

    if (heroTitleEl) {
      heroTitleEl.textContent = recipe.title;
    }

    if (heroDescriptionEl) {
      heroDescriptionEl.textContent = description;
    }

    if (heroImageEl) {
      heroImageEl.src = recipe.image || placeholderImage;
      heroImageEl.alt = `Foto von ${recipe.title}`;
    }

    if (heroMetaEl) {
      heroMetaEl.innerHTML = metaChips.length ? metaChips.join('') : '<span class="chip chip--muted">Keine Angaben verfügbar</span>';
    }

    if (dietTagsEl) {
      dietTagsEl.innerHTML = dietTags.join('');
      dietTagsEl.classList.toggle('is-hidden', dietTags.length === 0);
    }

    if (recipeContentEl) {
      recipeContentEl.innerHTML = contentHTML;
    }
  }

  function buildMetaChips(recipe) {
    const chips = [];
    const servingsValue = parseNumber(recipe.servings);
    const preparationTime = parseNumber(recipe.preparationTime);
    const kilocalories = parseNumber(recipe.nutrients?.kilocalories);

    if (Number.isFinite(servingsValue)) {
      chips.push(createChip('Portionen', pluralizePortions(servingsValue)));
    }

    if (Number.isFinite(preparationTime)) {
      chips.push(createChip('Zubereitung', `${Math.round(preparationTime)} Min.`));
    }

    if (Number.isFinite(kilocalories)) {
      chips.push(createChip('Kalorien', `${formatNumber(kilocalories)} kcal`));
    }

    return chips;
  }

  function buildDietTags(recipe) {
    const tags = [];
    if (recipe.vegetarian) tags.push('<span class="tag">Vegetarisch</span>');
    if (recipe.vegan) tags.push('<span class="tag">Vegan</span>');
    if (recipe.glutenfree) tags.push('<span class="tag">Glutenfrei</span>');
    if (recipe.lactosefree) tags.push('<span class="tag">Laktosefrei</span>');
    return tags;
  }

  function buildContent(recipe) {
    const servingsValue = parseNumber(recipe.servings);
    const ingredients = buildIngredients(recipe.ingredients || []);
    const steps = buildSteps(recipe.steps || []);
    const nutrition = buildNutrition(recipe.nutrients || {});
    const ratings = buildRatings(recipe);

    return `
      <div class="recipe-layout__main">
        <article class="recipe-card">
          <div class="recipe-card__header">
            <h2 class="recipe-section__title">Zutaten</h2>
            ${Number.isFinite(servingsValue) ? `<p class="recipe-card__subtitle">Für ${pluralizePortions(servingsValue)}</p>` : ''}
          </div>
          ${ingredients}
        </article>
        <article class="recipe-card">
          <h2 class="recipe-section__title">Zubereitung</h2>
          ${steps}
        </article>
      </div>
      <aside class="recipe-layout__aside">
        <article class="recipe-card">
          <h2 class="recipe-section__title">Nährwerte</h2>
          ${nutrition}
        </article>
        <article class="recipe-card">
          <h2 class="recipe-section__title">Bewertungen</h2>
          ${ratings}
        </article>
      </aside>
    `;
  }

  function buildIngredients(ingredients) {
    if (!ingredients.length) {
      return '<p>Keine Zutaten hinterlegt.</p>';
    }

    const items = ingredients.map((ingredient) => {
      const unitData = ingredient.unit && typeof ingredient.unit === 'object' ? ingredient.unit : null;
      const unitId = unitData?.id;
      const quantity = parseNumber(ingredient.quantity);
      const unitName = unitData?.name || (typeof ingredient.unit === 'string' ? ingredient.unit : '');
      const amountParts = [];

      if (Number.isFinite(quantity)) {
        if (unitId !== 11) {
          amountParts.push(formatNumber(quantity));
        } else if (!unitName) {
          amountParts.push(formatNumber(quantity));
        }
      }

      if (unitName && unitId !== 11) {
        amountParts.push(unitName);
      }

      const amountText = amountParts.join(' ').trim();
      const amountHtml = amountText ? `<span class="ingredient-amount">${amountText}</span>` : '';
      return `<li><span>${ingredient.name}</span>${amountHtml}</li>`;
    });

    return `<ul class="ingredient-list">${items.join('')}</ul>`;
  }

  function buildSteps(steps) {
    if (!steps.length) {
      return '<p>Keine Zubereitungsschritte vorhanden.</p>';
    }

    return steps.map((step, index) => {
      const stepIngredients = Array.isArray(step.head) && step.head.length
        ? `<ul class="step-ingredients">${step.head.map((item) => {
          const unitData = item.unit && typeof item.unit === 'object' ? item.unit : null;
          const unitId = unitData?.id;
          const unitName = unitData?.name || (typeof item.unit === 'string' ? item.unit : '');
          const quantity = parseNumber(item.quantity);
          const amountParts = [];

          if (Number.isFinite(quantity)) {
            if (unitId !== 11 || !unitName) {
              amountParts.push(formatNumber(quantity));
            }
          }

          if (unitName && unitId !== 11) {
            amountParts.push(unitName);
          }

          const amountText = amountParts.join(' ').trim();
          return `<li>${item.name}${amountText ? ` – ${amountText}` : ''}</li>`;
        }).join('')}</ul>`
        : '';

      return `
        <div class="step-card">
          <div class="step-card__header">
            <span class="step-number">Schritt ${index + 1}</span>
            <h3>${step.name || 'Arbeitsschritt'}</h3>
          </div>
          ${stepIngredients}
          <p>${step.content}</p>
        </div>
      `;
    }).join('');
  }

  function buildNutrition(nutrients) {
    const entries = [
      { label: 'Kalorien', value: Number.isFinite(nutrients.kilocalories) ? `${formatNumber(nutrients.kilocalories)} kcal` : null },
      { label: 'Kohlenhydrate', value: Number.isFinite(nutrients.carbohydrates) ? `${formatNumber(nutrients.carbohydrates)} g` : null },
      { label: 'Fett', value: Number.isFinite(nutrients.fat) ? `${formatNumber(nutrients.fat)} g` : null },
      { label: 'Eiweiß', value: Number.isFinite(nutrients.protein) ? `${formatNumber(nutrients.protein)} g` : null }
    ].filter(item => item.value);

    if (!entries.length) {
      return '<p>Keine Nährwertangaben verfügbar.</p>';
    }

    return `
      <div class="nutrition-grid">
        ${entries.map(entry => `
          <div class="nutrition-item">
            <span class="nutrition-label">${entry.label}</span>
            <span class="nutrition-value">${entry.value}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function buildRatings(recipe) {
    const ratingEntries = [
      { label: 'Alltäglichkeit', value: recipe.everydayRating },
      { label: 'Gesundheit', value: recipe.healthRating },
      { label: 'Preis', value: recipe.priceRating },
      { label: 'Schwierigkeit', value: recipe.difficultyRating },
      { label: 'Nachhaltigkeit', value: recipe.sustainabilityRating }
    ].filter(item => Number.isFinite(item.value));

    if (!ratingEntries.length) {
      return '<p>Noch keine Bewertungen.</p>';
    }

    return `
      <div class="ratings-grid">
        ${ratingEntries.map(entry => `
          <div class="rating-item">
            <span class="rating-label">${entry.label}</span>
            <span class="rating-value">${entry.value}/10</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function createChip(label, value) {
    return `<span class="chip"><span class="chip__label">${label}</span><strong>${value}</strong></span>`;
  }

  function pluralizePortions(value) {
    if (!Number.isFinite(value)) {
      return '-';
    }
    const rounded = Math.round(value);
    return `${rounded} Portion${rounded === 1 ? '' : 'en'}`;
  }

  function parseNumber(value) {
    if (value === null || value === undefined) {
      return NaN;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) {
      return value;
    }
    let rounded;
    if (Math.abs(value) >= 100 || Number.isInteger(value)) {
      rounded = Math.round(value);
    } else if (Math.abs(value) >= 10) {
      rounded = Number(value.toFixed(1));
    } else {
      rounded = Number(value.toFixed(2));
    }
    return rounded.toLocaleString('de-DE');
  }

  function toIsoDuration(value) {
    const minutes = parseNumber(value);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return undefined;
    }
    const totalMinutes = Math.max(1, Math.round(minutes));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    let isoString = 'PT';
    if (hours) {
      isoString += `${hours}H`;
    }
    if (mins || !hours) {
      isoString += `${mins}M`;
    }
    return isoString;
  }

  function toIsoDate(value) {
    if (!value) {
      return undefined;
    }
    try {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) {
        return undefined;
      }
      return date.toISOString();
    } catch (error) {
      return undefined;
    }
  }

  function ensureAbsoluteUrl(value, referenceUrl) {
    if (value === null || value === undefined) {
      return undefined;
    }
    const stringValue = String(value).trim();
    if (!stringValue) {
      return undefined;
    }
    try {
      const base = referenceUrl || window.location.origin;
      const url = new URL(stringValue, base);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return url.href;
      }
      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  function buildInstructionAnchor(baseUrl, index) {
    if (!baseUrl) {
      return undefined;
    }
    try {
      const url = new URL(baseUrl);
      url.hash = `schritt-${index + 1}`;
      return url.href;
    } catch (error) {
      return `${baseUrl}#schritt-${index + 1}`;
    }
  }

  function mapSeasonLabel(value) {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
    const mapping = {
      1: 'Frühling',
      2: 'Sommer',
      3: 'Herbst',
      4: 'Winter'
    };
    return mapping[value] || undefined;
  }

  function buildKeywordList(recipe) {
    const keywords = new Set();
    if (recipe.title) {
      keywords.add(recipe.title);
    }
    if (recipe.type) {
      keywords.add(recipe.type);
    }
    if (recipe.originCountry) {
      keywords.add(recipe.originCountry);
    }
    const seasonLabel = mapSeasonLabel(recipe.season);
    if (seasonLabel) {
      keywords.add(`${seasonLabel} Rezept`);
    }
    if (recipe.vegetarian) keywords.add('vegetarisch');
    if (recipe.vegan) keywords.add('vegan');
    if (recipe.glutenfree) keywords.add('glutenfrei');
    if (recipe.lactosefree) keywords.add('laktosefrei');
    (recipe.ingredients || [])
      .map((ingredient) => ingredient?.name)
      .filter(Boolean)
      .slice(0, 8)
      .forEach((name) => keywords.add(name));
    return Array.from(keywords).filter(Boolean);
  }

  function computeAggregateRating(ratings) {
    if (!Array.isArray(ratings)) {
      return undefined;
    }
    const validRatings = ratings
      .map((entry) => parseNumber(entry?.stars))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (!validRatings.length) {
      return undefined;
    }
    const sum = validRatings.reduce((acc, value) => acc + value, 0);
    const average = sum / validRatings.length;
    return {
      "@type": "AggregateRating",
      "ratingValue": Number(average.toFixed(2)),
      "ratingCount": validRatings.length,
      "bestRating": 5,
      "worstRating": 1
    };
  }

  function updateMetaTags(recipe, currentUrl) {
    const title = `${recipe.title} - Murmli`;
    const description = recipe.descriptionShort || recipe.description || `Entdecke das Rezept für ${recipe.title} mit Murmli!`;
    const image = recipe.image || placeholderImage;

    document.title = title;
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
      pageTitle.textContent = title;
    }

    setMetaContent('page-description', description);
    setMetaContent('og-url', currentUrl);
    setMetaContent('og-title', recipe.title);
    setMetaContent('og-description', description);
    setMetaContent('og-image', image);
    setMetaContent('og-image-alt', `Foto von ${recipe.title}`);

    setMetaContent('twitter-url', currentUrl);
    setMetaContent('twitter-title', recipe.title);
    setMetaContent('twitter-description', description);
    setMetaContent('twitter-image', image);
    setMetaContent('twitter-image-alt', `Foto von ${recipe.title}`);
  }

  function setMetaContent(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.content = value;
    }
  }

  function injectRecipeSchema(recipe, currentUrl) {
    const existing = document.getElementById('recipe-schema');
    if (existing) {
      existing.remove();
    }

    let canonicalUrl = currentUrl;
    try {
      const parsed = new URL(currentUrl);
      parsed.hash = '';
      parsed.search = '';
      canonicalUrl = parsed.href;
    } catch (error) {
      canonicalUrl = currentUrl;
    }

    const recipeIngredients = (recipe.ingredients || []).map((ingredient) => {
      const unitData = ingredient.unit && typeof ingredient.unit === 'object' ? ingredient.unit : null;
      const unitId = unitData?.id;
      const quantity = parseNumber(ingredient.quantity);
      const unitName = unitData?.name || (typeof ingredient.unit === 'string' ? ingredient.unit : '');
      const parts = [];
      if (Number.isFinite(quantity) && unitId !== 11) {
        parts.push(formatNumber(quantity));
      }
      if (unitName && unitId !== 11) {
        parts.push(unitName);
      }
      return `${parts.join(' ')} ${ingredient.name}`.trim();
    }).filter(Boolean);

    let absoluteImage = ensureAbsoluteUrl(recipe.image, canonicalUrl)
      || ensureAbsoluteUrl(placeholderImage, canonicalUrl);
    if (!absoluteImage) {
      try {
        const origin = new URL(canonicalUrl).origin;
        absoluteImage = `${origin}${placeholderImage}`;
      } catch (error) {
        absoluteImage = placeholderImage;
      }
    }

    const servingsValue = parseNumber(recipe.servings);
    const recipeYield = Number.isFinite(servingsValue)
      ? pluralizePortions(servingsValue)
      : (recipe.servings ? String(recipe.servings) : undefined);

    const prepDuration = toIsoDuration(recipe.preparationTime);
    const cookDuration = toIsoDuration(recipe.cookTime ?? recipe.preparationTime);
    const totalDuration = toIsoDuration(recipe.totalTime ?? recipe.preparationTime) || cookDuration || prepDuration;
    const keywordsList = buildKeywordList(recipe);
    const aggregateRating = computeAggregateRating(recipe.ratings);

    const recipeInstructions = (recipe.steps || []).map((step, index) => {
      const rawText = step?.content || step?.description || step?.name || `Schritt ${index + 1}`;
      const instruction = {
        "@type": "HowToStep",
        "position": index + 1,
        "name": step?.name || `Schritt ${index + 1}`,
        "text": typeof rawText === 'string' ? rawText : String(rawText),
        "url": buildInstructionAnchor(canonicalUrl, index)
      };
      if (absoluteImage) {
        instruction.image = absoluteImage;
      }
      return instruction;
    });

    const schema = {
      "@context": "https://schema.org",
      "@type": "Recipe",
      "@id": canonicalUrl,
      "url": canonicalUrl,
      "name": recipe.title,
      "description": recipe.descriptionShort || recipe.description,
      "image": absoluteImage,
      "recipeYield": recipeYield,
      "prepTime": prepDuration,
      "cookTime": cookDuration,
      "totalTime": totalDuration,
      "recipeIngredient": recipeIngredients,
      "recipeInstructions": recipeInstructions,
      "recipeCategory": recipe.type || undefined,
      "recipeCuisine": recipe.originCountry || undefined,
      "keywords": keywordsList.length ? keywordsList.join(', ') : undefined,
      "author": {
        "@type": "Organization",
        "name": recipe.provider || 'Murmli'
      },
      "mainEntityOfPage": canonicalUrl,
      "datePublished": toIsoDate(recipe.createdAt),
      "dateModified": toIsoDate(recipe.updatedAt),
      "aggregateRating": aggregateRating,
      "nutrition": recipe.nutrients ? {
        "@type": "NutritionInformation",
        "calories": Number.isFinite(recipe.nutrients.kilocalories) ? `${formatNumber(recipe.nutrients.kilocalories)} kcal` : undefined,
        "carbohydrateContent": Number.isFinite(recipe.nutrients.carbohydrates) ? `${formatNumber(recipe.nutrients.carbohydrates)} g` : undefined,
        "fatContent": Number.isFinite(recipe.nutrients.fat) ? `${formatNumber(recipe.nutrients.fat)} g` : undefined,
        "proteinContent": Number.isFinite(recipe.nutrients.protein) ? `${formatNumber(recipe.nutrients.protein)} g` : undefined
      } : undefined
    };

    const cleanedSchema = JSON.parse(JSON.stringify(schema));

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'recipe-schema';
    script.textContent = JSON.stringify(cleanedSchema);
    document.head.appendChild(script);
  }
})();
