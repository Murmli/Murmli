import { InAppReview } from '@capacitor-community/in-app-review';

/**
 * Versucht, den In-App-Review-Dialog anzuzeigen.
 * Das Betriebssystem (Android/iOS) entscheidet selbstständig anhand interner Quoten,
 * ob der Dialog dem Nutzer tatsächlich angezeigt wird.
 */
export const maybeShowRatingPrompt = async () => {
  try {
    await InAppReview.requestReview();
  } catch (e) {
    // Fehler silent ignorieren, da dies oft vorkommt, wenn Quoten erfüllt sind 
    // oder die API nicht verfügbar ist (z.B. im Browser)
    console.debug('In-App Review request finished/failed', e);
  }
};

/**
 * Erzwingt die Anfrage eines Reviews (z.B. durch manuellen Klick in den Einstellungen).
 * Auch hier entscheidet letztlich das OS über die Anzeige.
 */
export const forceShowRatingPrompt = async () => {
  try {
    await InAppReview.requestReview();
  } catch (e) {
    console.error('In-App Review failed', e);
  }
};

// Veraltete Funktion für Kompatibilität beibehalten, falls noch irgendwo aufgerufen
export const delayRatingPrompt = () => {
  // Keine Aktion mehr nötig, da OS-gesteuert
};
