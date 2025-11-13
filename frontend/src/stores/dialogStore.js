import { defineStore } from "pinia";
import { ref } from "vue";

export const useDialogStore = defineStore("dialogStore", () => {
  // State für spezifische Dialoge
  const dialogs = ref({
    confirmDialog: {
      open: false,
      title: "",
      text: "",
      action: null,
    },
    listSortDialog: false, // Initialwert des Dialogs
    shareListDialog: false,
    welcomeWindow: false,
    plannerFilterDialog: false,
    plannerHelpWindow: false,
    recipesHelpWindow: false,
    trackerHelpWindow: false,
    userRecipeDialog: false,
    addRecipeDialog: false,
    recipeFeedbackDialog: false,
    trackActivityDialog: false,
    trackRecipeDialog: false,
    bodyDataDialog: false,
    calorieGoalDialog: false,
    trackVoiceDialog: false,
    trackImageDialog: false,
    shoppingVoiceDialog: false,
    trainingPlanVoiceDialog: false,
    recipeVoiceDialog: false,
    editRecipeVoiceDialog: false,
    plannerPromptVoiceDialog: false,
    askDialog: false,
    trackImageDialog: false,
    imageDialog: false,
    trainingPlansHelpWindow: false,
    createTrainingPlanDialog: false,
    editTrainingPlanDialog: false,
    editRecipeDialog: false,
    selectTrainingDayDialog: false, // <--- NEU für Trainingstag-Auswahl
    askTrainingPlanDialog: false,
    continueTrainingPlanDialog: false,
  });

  const imageSrc = ref('');

  // Dialog öffnen
  const openDialog = (key) => {
    if (key in dialogs.value) {
      dialogs.value[key] = true;
    } else {
      console.error(`Dialog key "${key}" not found.`);
    }
  };

  // Dialog schließen
  const closeDialog = (key) => {
    if (key in dialogs.value) {
      dialogs.value[key] = false;
    } else {
      console.error(`Dialog key "${key}" not found.`);
    }
  };

  // Dialog-Toggle (öffnen/schließen)
  const toggleDialog = (key) => {
    if (key in dialogs.value) {
      dialogs.value[key] = !dialogs.value[key];
    } else {
      console.error(`Dialog key "${key}" not found.`);
    }
  };

  // Dialog-Zustand abfragen
  const isDialogOpen = (key) => {
    if (key in dialogs.value) {
      return dialogs.value[key];
    } else {
      console.error(`Dialog key "${key}" not found.`);
      return false;
    }
  };

  // Bestätigungsdialog öffnen
  const openConfirmDialog = (title, text, action) => {
    dialogs.value.confirmDialog = {
      open: true,
      title,
      text,
      action,
    };
  };

  // Bestätigungsdialog schließen
  const closeConfirmDialog = () => {
    dialogs.value.confirmDialog = {
      open: false,
      title: "",
      text: "",
      action: null,
    };
  };

  // Aktion ausführen und Dialog schließen
  const confirmAction = () => {
    if (dialogs.value.confirmDialog.action) {
      dialogs.value.confirmDialog.action();
    }
    closeConfirmDialog();
  };

  return {
    dialogs,
    imageSrc,
    openDialog,
    closeDialog,
    toggleDialog,
    isDialogOpen,
    openConfirmDialog,
    closeConfirmDialog,
    confirmAction,
  };
});
