import { useDialogStore } from '@/stores/dialogStore';

const STORAGE_KEY = 'murmli_app_rated';
const SHOWN_KEY = 'murmli_app_rating_shown';
const PROBABILITY = 1 / 300; // 1 zu 300 Wahrscheinlichkeit

/**
 * Überprüft, ob der Bewertungs-Dialog angezeigt werden soll.
 * Wird nur angezeigt, wenn noch nicht bewertet wurde, er noch nie gezeigt wurde und die Zufallschance greift.
 */
export const maybeShowRatingPrompt = () => {
  const isRated = localStorage.getItem(STORAGE_KEY);
  const isShown = localStorage.getItem(SHOWN_KEY);

  if (isRated === 'true' || isShown === 'true') return;

  if (Math.random() < PROBABILITY) {
    const dialogStore = useDialogStore();
    dialogStore.openDialog('appRatingPrompt');
    // Sofort markieren, dass er einmal gezeigt wurde
    localStorage.setItem(SHOWN_KEY, 'true');
  }
};

/**
 * Erzwingt das Anzeigen des Bewertungs-Dialogs (für Developer).
 * Ignoriert den STORAGE_KEY Status.
 */
export const forceShowRatingPrompt = () => {
  const dialogStore = useDialogStore();
  dialogStore.openDialog('appRatingPrompt');
};
