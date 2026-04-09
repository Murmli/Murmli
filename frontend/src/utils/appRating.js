import { useDialogStore } from '@/stores/dialogStore';

const VISITS_KEY = 'murmli_app_visits';
const TARGET_VISITS = 50;
const PAUSE_VISITS = 500;

/**
 * Überprüft, ob der Bewertungs-Dialog angezeigt werden soll.
 * Wird angezeigt nach jedem 50. Aufruf (bzw. "Besuch").
 */
export const maybeShowRatingPrompt = () => {
  let visits = parseInt(localStorage.getItem(VISITS_KEY)) || 0;
  visits++;

  if (visits >= TARGET_VISITS) {
    const dialogStore = useDialogStore();
    dialogStore.openDialog('appRatingPrompt');
    // Zurücksetzen, damit es nach weiteren 50 wieder erscheint
    localStorage.setItem(VISITS_KEY, '0');
  } else {
    localStorage.setItem(VISITS_KEY, visits.toString());
  }
};

/**
 * Pausiert den Dialog für die nächsten 500 Besuche.
 * Wird aufgerufen, wenn der Benutzer auf "Bewerten" klickt.
 */
export const delayRatingPrompt = () => {
  // Wenn der Benutzer bewertet hat, setzen wir den Zähler so zurück,
  // dass es genau 500 + 50 (TARGET_VISITS) Aufrufe braucht, bis er wieder bei TARGET_VISITS landet.
  const pauseValue = TARGET_VISITS - PAUSE_VISITS; // 50 - 500 = -450
  localStorage.setItem(VISITS_KEY, pauseValue.toString());
};

/**
 * Erzwingt das Anzeigen des Bewertungs-Dialogs (für Developer/Admins).
 * Setzt außerdem den Zähler und alle dazugehörigen States zurück.
 */
export const forceShowRatingPrompt = () => {
  const dialogStore = useDialogStore();
  
  // Zähler auf 0 setzen (setzt auch "RateNow 500er-Pause" zurück)
  localStorage.setItem(VISITS_KEY, '0');
  
  // Entferne alte Keys vom vorherigen System, falls noch vorhanden
  localStorage.removeItem('murmli_app_rated');
  localStorage.removeItem('murmli_app_rating_shown');

  dialogStore.openDialog('appRatingPrompt');
};
