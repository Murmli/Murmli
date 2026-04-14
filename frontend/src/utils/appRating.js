import { InAppReview } from '@capacitor-community/in-app-review';

const VISITS_KEY = 'murmli_app_visits';
const TARGET_VISITS = 50;
const PAUSE_VISITS = 500;

/**
 * Überprüft, ob der Bewertungs-Dialog angezeigt werden soll.
 * Wird angezeigt nach jedem 50. Aufruf (bzw. "Besuch").
 */
export const maybeShowRatingPrompt = async () => {
  let visits = parseInt(localStorage.getItem(VISITS_KEY)) || 0;
  visits++;

  if (visits >= TARGET_VISITS) {
    try {
      await InAppReview.requestReview();
      // Zurücksetzen, damit es nach weiteren 500 (Pause) wieder erscheint
      const pauseValue = TARGET_VISITS - PAUSE_VISITS;
      localStorage.setItem(VISITS_KEY, pauseValue.toString());
    } catch (e) {
      console.error('In-App Review failed', e);
      localStorage.setItem(VISITS_KEY, visits.toString());
    }
  } else {
    localStorage.setItem(VISITS_KEY, visits.toString());
  }
};

/**
 * Pausiert den Dialog für die nächsten 500 Besuche.
 * Wird aufgerufen, wenn der Benutzer auf "Bewerten" klickt.
 */
export const delayRatingPrompt = () => {
  const pauseValue = TARGET_VISITS - PAUSE_VISITS; // 50 - 500 = -450
  localStorage.setItem(VISITS_KEY, pauseValue.toString());
};

/**
 * Erzwingt das Anzeigen des Bewertungs-Dialogs (für Developer/Admins).
 * Setzt außerdem den Zähler und alle dazugehörigen States zurück.
 */
export const forceShowRatingPrompt = async () => {
  // Zähler auf 0 setzen
  localStorage.setItem(VISITS_KEY, '0');
  
  // Entferne alte Keys vom vorherigen System, falls noch vorhanden
  localStorage.removeItem('murmli_app_rated');
  localStorage.removeItem('murmli_app_rating_shown');

  try {
    await InAppReview.requestReview();
  } catch (e) {
    console.error('In-App Review failed', e);
  }
};
