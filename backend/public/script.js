// Get the modal elements
const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImage");
const captionText = document.getElementById("caption");

// Get all images with the class 'feature-image-clickable'
const images = document.querySelectorAll('.feature-image-clickable');

if (modal && modalImg && captionText && images.length) {
  images.forEach(img => {
    img.onclick = function () {
      modal.style.display = "block";
      modalImg.src = this.src; // Use the clicked image's source
      captionText.innerHTML = this.alt; // Use the image's alt text as caption
    }
  });

  // Get the <span> element that closes the modal
  const span = document.getElementsByClassName("close-modal")[0];

  // When the user clicks on <span> (x), close the modal
  if (span) {
    span.onclick = function () {
      modal.style.display = "none";
    }
  }

  // Optional: Close the modal if the user clicks anywhere outside the image
  window.addEventListener('click', function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
}

// Calorie calculator logic
const calculatorForm = document.getElementById('calorie-calculator-form');
const calculatorResult = document.getElementById('calorie-calculator-result');

function parseNumber(value) {
  if (value === null || value === undefined) {
    return NaN;
  }
  const normalised = String(value).replace(',', '.').trim();
  if (normalised === '') {
    return NaN;
  }
  const parsed = parseFloat(normalised);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function calculateAgeFromYear(birthYear) {
  const year = parseInt(birthYear, 10);
  if (!Number.isFinite(year)) {
    return NaN;
  }
  const currentYear = new Date().getFullYear();
  return currentYear - year;
}

function calculateCaloriesFromInputs(gender, weight, height, age, workHoursWeek, workHoursPAL, restHoursPAL) {
  const safeWeight = Number.isFinite(weight) ? weight : 0;
  const safeHeight = Number.isFinite(height) ? height : 0;
  const safeAge = Number.isFinite(age) ? age : 0;
  const safeWorkHoursWeek = Number.isFinite(workHoursWeek) ? workHoursWeek : 0;
  const safeWorkHoursPAL = Number.isFinite(workHoursPAL) ? workHoursPAL : 0;
  const safeRestHoursPAL = Number.isFinite(restHoursPAL) ? restHoursPAL : 1.2;

  let bmr;
  if (gender === 'male') {
    bmr = 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge + 5;
  } else {
    bmr = 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge - 161;
  }

  const dailyWorkHours = Math.min(Math.max(safeWorkHoursWeek / 7, 0), 24);
  const dailyRestHours = 24 - dailyWorkHours;
  const baseEnergyPerHour = bmr / 24;
  const workHoursCalories = baseEnergyPerHour * dailyWorkHours * Math.max(safeWorkHoursPAL, 0);
  const restHoursCalories = baseEnergyPerHour * dailyRestHours * Math.max(safeRestHoursPAL, 0);
  const totalDailyCalories = workHoursCalories + restHoursCalories;

  return {
    bmr: Math.round(bmr),
    workHoursCalories: Math.round(workHoursCalories),
    restHoursCalories: Math.round(restHoursCalories),
    totalDailyCalories: Math.round(totalDailyCalories)
  };
}

function calculateDietCalories(totalCalories, level) {
  let multiplier = 1;
  switch (level) {
    case 'strongLose':
      multiplier = 0.75;
      break;
    case 'lose':
      multiplier = 0.85;
      break;
    case 'maintain':
      multiplier = 1;
      break;
    case 'gain':
      multiplier = 1.1;
      break;
    case 'strongGain':
      multiplier = 1.2;
      break;
    default:
      multiplier = 1;
      break;
  }
  return Math.round(totalCalories * multiplier);
}

// Load embedded calculator translations if present
let calcI18n = {};
try {
  const i18nElem = document.getElementById('i18n-calculator');
  if (i18nElem && i18nElem.textContent.trim()) {
    calcI18n = JSON.parse(i18nElem.textContent.trim());
  }
} catch (e) {
  console.warn("Could not load calculator translations:", e);
}

function getCalcText(key, fallback) {
  return (calcI18n && calcI18n[key]) ? calcI18n[key] : fallback;
}

function formatCalories(value) {
  const locale = document.documentElement.lang || 'de';
  return Number.isFinite(value) ? Math.round(value).toLocaleString(locale) : '0';
}

function renderCalculatorResult(target, stats, recommendations) {
  const summaryTpl = getCalcText('summary_text', 'Dein täglicher Gesamtumsatz beträgt etwa <strong>{calories} Kilokalorien</strong>.');
  const summary = summaryTpl.replace('{calories}', formatCalories(stats.totalDailyCalories));
  const isMobile = window.innerWidth <= 480;

  const title = getCalcText('evaluation_title', 'Deine Auswertung');
  const bmrLabel = getCalcText('bmr', 'Grundumsatz (BMR)');
  const workLabel = getCalcText('work_calories', 'Arbeitsumsatz');
  const restLabel = getCalcText('rest_calories', 'Freizeit und Ruhe');
  const mobileHint = getCalcText('mobile_hint', 'Nutze diese Orientierung für deine Mahlzeitenplanung:');
  const strongLossLabel = getCalcText('strong_loss', 'Deutliches Defizit (-25%)');
  const moderateLossLabel = getCalcText('moderate_loss', 'Moderates Defizit (-15%)');
  const maintainLabel = getCalcText('maintain', 'Gewicht halten');
  const moderateGainLabel = getCalcText('moderate_gain', 'Moderater Aufbau (+10%)');
  const strongGainLabel = getCalcText('strong_gain', 'Intensiver Aufbau (+20%)');
  const note = getCalcText('mobile_note', 'Diese Werte bilden die Basis für personalisierte Rezepte, Einkaufslisten und Trainingspläne direkt in Murmli.');
  const tableTargetHeader = getCalcText('table_target_header', 'Zielbereich');
  const tableCaloriesHeader = getCalcText('table_calories_header', 'Empfohlene Kalorien');
  const tableIntro = getCalcText('table_intro', 'Nutze die Orientierung aus der Murmli App, um deine Mahlzeitenplanung auf deinen Bedarf auszurichten:');

  if (isMobile) {
    // Mobile-optimierte Darstellung
    target.innerHTML = `
      <h3>${title}</h3>
      <p class="calorie-calculator__summary">${summary}</p>
      
      <div class="calorie-calculator__mobile-breakdown">
        <div class="breakdown-item">
          <span class="breakdown-label">${bmrLabel}</span>
          <span class="breakdown-value">${formatCalories(stats.bmr)} kcal</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-label">${workLabel}</span>
          <span class="breakdown-value">${formatCalories(stats.workHoursCalories)} kcal</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-label">${restLabel}</span>
          <span class="breakdown-value">${formatCalories(stats.restHoursCalories)} kcal</span>
        </div>
      </div>
      
      <p class="calorie-calculator__mobile-hint">${mobileHint}</p>
      
      <div class="calorie-calculator__mobile-targets">
        <div class="target-card">
          <h4>${strongLossLabel}</h4>
          <div class="target-value">${formatCalories(recommendations.strongLose)} kcal</div>
        </div>
        <div class="target-card">
          <h4>${moderateLossLabel}</h4>
          <div class="target-value">${formatCalories(recommendations.lose)} kcal</div>
        </div>
        <div class="target-card">
          <h4>${maintainLabel}</h4>
          <div class="target-value">${formatCalories(recommendations.maintain)} kcal</div>
        </div>
        <div class="target-card">
          <h4>${moderateGainLabel}</h4>
          <div class="target-value">${formatCalories(recommendations.gain)} kcal</div>
        </div>
        <div class="target-card">
          <h4>${strongGainLabel}</h4>
          <div class="target-value">${formatCalories(recommendations.strongGain)} kcal</div>
        </div>
      </div>
      
      <p class="calorie-calculator__mobile-note">${note}</p>
    `;
  } else {
    // Desktop-Darstellung (original)
    target.innerHTML = `
      <h3>${title}</h3>
      <p class="calorie-calculator__summary">${summary}</p>
      <dl class="calorie-calculator__breakdown">
        <div>
          <dt>${bmrLabel}</dt>
          <dd>${formatCalories(stats.bmr)} kcal</dd>
        </div>
        <div>
          <dt>${workLabel}</dt>
          <dd>${formatCalories(stats.workHoursCalories)} kcal</dd>
        </div>
        <div>
          <dt>${restLabel}</dt>
          <dd>${formatCalories(stats.restHoursCalories)} kcal</dd>
        </div>
      </dl>
      <p>${tableIntro}</p>
      <table class="calorie-calculator__targets" aria-label="Kalorienempfehlungen">
        <thead>
          <tr>
            <th>${tableTargetHeader}</th>
            <th>${tableCaloriesHeader}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${strongLossLabel}</td>
            <td><strong>${formatCalories(recommendations.strongLose)} kcal</strong></td>
          </tr>
          <tr>
            <td>${moderateLossLabel}</td>
            <td><strong>${formatCalories(recommendations.lose)} kcal</strong></td>
          </tr>
          <tr>
            <td>${maintainLabel}</td>
            <td><strong>${formatCalories(recommendations.maintain)} kcal</strong></td>
          </tr>
          <tr>
            <td>${moderateGainLabel}</td>
            <td><strong>${formatCalories(recommendations.gain)} kcal</strong></td>
          </tr>
          <tr>
            <td>${strongGainLabel}</td>
            <td><strong>${formatCalories(recommendations.strongGain)} kcal</strong></td>
          </tr>
        </tbody>
      </table>
      <p>${note}</p>
    `;
  }
}

function renderCalculatorError(target, message) {
  target.innerHTML = `<p class="calorie-calculator__error">${message}</p>`;
}

if (calculatorForm && calculatorResult) {
  const birthYearInput = calculatorForm.querySelector('#birthYear');
  if (birthYearInput && !birthYearInput.value) {
    const defaultYear = new Date().getFullYear() - 30;
    birthYearInput.value = String(defaultYear);
  }

  calculatorForm.addEventListener('submit', function (event) {
    event.preventDefault();

    if (!calculatorForm.checkValidity()) {
      calculatorForm.reportValidity();
      return;
    }

    const formData = new FormData(calculatorForm);
    const gender = formData.get('gender') === 'female' ? 'female' : 'male';
    const weight = parseNumber(formData.get('weight'));
    const height = parseNumber(formData.get('height'));
    const birthYear = formData.get('birthYear');
    const age = calculateAgeFromYear(birthYear);
    const workHoursWeek = parseNumber(formData.get('workHoursWeek'));
    const workHoursPAL = parseNumber(formData.get('workHoursPAL'));
    const restHoursPAL = parseNumber(formData.get('restHoursPAL'));

    if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(height) || height <= 0) {
      renderCalculatorError(calculatorResult, getCalcText('error_inputs', 'Bitte gib ein plausibles Gewicht und eine Größe größer als 0 cm an.'));
      return;
    }

    if (!Number.isFinite(age) || age < 10 || age > 100) {
      renderCalculatorError(calculatorResult, getCalcText('error_age', 'Bitte prüfe dein Geburtsjahr, damit wir dein Alter korrekt berechnen können.'));
      return;
    }

    const stats = calculateCaloriesFromInputs(
      gender,
      weight,
      height,
      age,
      Number.isFinite(workHoursWeek) ? workHoursWeek : 0,
      Number.isFinite(workHoursPAL) ? workHoursPAL : 1.2,
      Number.isFinite(restHoursPAL) ? restHoursPAL : 1.2
    );

    const recommendations = {
      strongLose: calculateDietCalories(stats.totalDailyCalories, 'strongLose'),
      lose: calculateDietCalories(stats.totalDailyCalories, 'lose'),
      maintain: calculateDietCalories(stats.totalDailyCalories, 'maintain'),
      gain: calculateDietCalories(stats.totalDailyCalories, 'gain'),
      strongGain: calculateDietCalories(stats.totalDailyCalories, 'strongGain')
    };

    renderCalculatorResult(calculatorResult, stats, recommendations);

    // Scroll zur Auswertung nach der Berechnung
    setTimeout(() => {
      calculatorResult.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  });
}

// Mobile Navigation
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');

if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', function () {
    const isActive = this.classList.toggle('active');
    mainNav.classList.toggle('active', isActive);
    document.body.classList.toggle('nav-open', isActive);
    this.setAttribute('aria-expanded', isActive ? 'true' : 'false');
  });

  // Schließe Menü beim Klick auf Links
  const navLinks = mainNav.querySelectorAll('a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      mainNav.classList.remove('active');
      document.body.classList.remove('nav-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Schließe Menü beim Klick außerhalb
  document.addEventListener('click', (e) => {
    if (mainNav.classList.contains('active') &&
      !mainNav.contains(e.target) &&
      !menuToggle.contains(e.target)) {
      menuToggle.classList.remove('active');
      mainNav.classList.remove('active');
      document.body.classList.remove('nav-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// Prevent click on disabled store download buttons
function initDisabledStoreButtons() {
  document.querySelectorAll('.store-link--disabled, .store-link[aria-disabled="true"]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });
}

// DOM Ready initialization
document.addEventListener('DOMContentLoaded', function () {
  // Clean up any stale appLocale cookie from previous versions
  if (document.cookie.includes('appLocale=')) {
    document.cookie = "appLocale=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  }

  initDisabledStoreButtons();

  // Loading-State für den Kalorienrechner
  const calorieForm = document.getElementById('calorie-calculator-form');
  if (calorieForm) {
    calorieForm.addEventListener('submit', function () {
      const submitBtn = this.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.innerHTML = getCalcText('btn_calculating', 'Berechne...');
        submitBtn.disabled = true;

        // Reset nach kurzer Zeit (falls Berechnung sehr schnell)
        setTimeout(() => {
          submitBtn.innerHTML = getCalcText('btn_calculate', 'Kalorienbedarf berechnen');
          submitBtn.disabled = false;
        }, 2000);
      }
    });
  }

  // Lazy Loading für Bilder
  const featureImages = document.querySelectorAll('.feature-image');
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          imageObserver.unobserve(img);
        }
      });
    });

    featureImages.forEach(img => {
      if (img.getAttribute('data-src')) {
        imageObserver.observe(img);
      }
    });
  }
});
