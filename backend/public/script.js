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

function formatCalories(value) {
  return Number.isFinite(value) ? Math.round(value).toLocaleString('de-DE') : '0';
}

function renderCalculatorResult(target, stats, recommendations) {
  const summary = `Dein täglicher Gesamtumsatz beträgt etwa <strong>${formatCalories(stats.totalDailyCalories)} Kilokalorien</strong>.`;
  const isMobile = window.innerWidth <= 480;

  if (isMobile) {
    // Mobile-optimierte Darstellung
    target.innerHTML = `
      <h3>Deine Auswertung</h3>
      <p class="calorie-calculator__summary">${summary}</p>
      
      <div class="calorie-calculator__mobile-breakdown">
        <div class="breakdown-item">
          <span class="breakdown-label">Grundumsatz (BMR)</span>
          <span class="breakdown-value">${formatCalories(stats.bmr)} kcal</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-label">Arbeitsumsatz</span>
          <span class="breakdown-value">${formatCalories(stats.workHoursCalories)} kcal</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-label">Freizeit und Ruhe</span>
          <span class="breakdown-value">${formatCalories(stats.restHoursCalories)} kcal</span>
        </div>
      </div>
      
      <p class="calorie-calculator__mobile-hint">Nutze diese Orientierung für deine Mahlzeitenplanung:</p>
      
      <div class="calorie-calculator__mobile-targets">
        <div class="target-card">
          <h4>Deutliches Defizit (-25%)</h4>
          <div class="target-value">${formatCalories(recommendations.strongLose)} kcal</div>
        </div>
        <div class="target-card">
          <h4>Moderates Defizit (-15%)</h4>
          <div class="target-value">${formatCalories(recommendations.lose)} kcal</div>
        </div>
        <div class="target-card">
          <h4>Gewicht halten</h4>
          <div class="target-value">${formatCalories(recommendations.maintain)} kcal</div>
        </div>
        <div class="target-card">
          <h4>Moderater Aufbau (+10%)</h4>
          <div class="target-value">${formatCalories(recommendations.gain)} kcal</div>
        </div>
        <div class="target-card">
          <h4>Intensiver Aufbau (+20%)</h4>
          <div class="target-value">${formatCalories(recommendations.strongGain)} kcal</div>
        </div>
      </div>
      
      <p class="calorie-calculator__mobile-note">Diese Werte bilden die Basis für personalisierte Rezepte, Einkaufslisten und Trainingspläne direkt in Murmli.</p>
    `;
  } else {
    // Desktop-Darstellung (original)
    target.innerHTML = `
      <h3>Deine Auswertung</h3>
      <p class="calorie-calculator__summary">${summary}</p>
      <dl class="calorie-calculator__breakdown">
        <div>
          <dt>Grundumsatz (BMR)</dt>
          <dd>${formatCalories(stats.bmr)} kcal</dd>
        </div>
        <div>
          <dt>Arbeitsumsatz</dt>
          <dd>${formatCalories(stats.workHoursCalories)} kcal</dd>
        </div>
        <div>
          <dt>Freizeit und Ruhe</dt>
          <dd>${formatCalories(stats.restHoursCalories)} kcal</dd>
        </div>
      </dl>
      <p>Nutze die Orientierung aus der Murmli App, um deine Mahlzeitenplanung auf deinen Bedarf auszurichten:</p>
      <table class="calorie-calculator__targets" aria-label="Kalorienempfehlungen">
        <thead>
          <tr>
            <th>Zielbereich</th>
            <th>Empfohlene Kalorien</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Deutliches Defizit (-25 %)</td>
            <td><strong>${formatCalories(recommendations.strongLose)} kcal</strong></td>
          </tr>
          <tr>
            <td>Moderates Defizit (-15 %)</td>
            <td><strong>${formatCalories(recommendations.lose)} kcal</strong></td>
          </tr>
          <tr>
            <td>Gewicht halten</td>
            <td><strong>${formatCalories(recommendations.maintain)} kcal</strong></td>
          </tr>
          <tr>
            <td>Moderater Aufbau (+10 %)</td>
            <td><strong>${formatCalories(recommendations.gain)} kcal</strong></td>
          </tr>
          <tr>
            <td>Intensiver Aufbau (+20 %)</td>
            <td><strong>${formatCalories(recommendations.strongGain)} kcal</strong></td>
          </tr>
        </tbody>
      </table>
      <p>Diese Werte bilden die Basis für personalisierte Rezepte, Einkaufslisten und Trainingspläne direkt in Murmli.</p>
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
      renderCalculatorError(calculatorResult, 'Bitte gib ein plausibles Gewicht und eine Größe größer als 0 cm an.');
      return;
    }

    if (!Number.isFinite(age) || age < 10 || age > 100) {
      renderCalculatorError(calculatorResult, 'Bitte prüfe dein Geburtsjahr, damit wir dein Alter korrekt berechnen können.');
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

// Verbesserte Touch-Interaktionen
document.addEventListener('DOMContentLoaded', function () {
  // Füge Loading-State für den Kalorienrechner hinzu
  const calorieForm = document.getElementById('calorie-calculator-form');
  if (calorieForm) {
    calorieForm.addEventListener('submit', function () {
      const submitBtn = this.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.innerHTML = 'Berechne...';
        submitBtn.disabled = true;

        // Reset nach kurzer Zeit (falls Berechnung sehr schnell)
        setTimeout(() => {
          submitBtn.innerHTML = 'Kalorienbedarf berechnen';
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
