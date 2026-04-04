import { useDialogStore } from '@/stores/dialogStore';

const STORAGE_KEY = 'murmli_app_rated';
const PROBABILITY = 0.02; // 2% Wahrscheinlichkeit

/**
 * Überprüft, ob der Bewertungs-Dialog angezeigt werden soll.
 * Wird nur angezeigt, wenn noch nicht bewertet wurde und die Zufallschance greift.
 */
export const maybeShowRatingPrompt = () => {
  const isRated = localStorage.getItem(STORAGE_KEY);
  if (isRated === 'true') return;

  if (Math.random() < PROBABILITY) {
    const dialogStore = useDialogStore();
    dialogStore.openDialog('appRatingPrompt');
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
