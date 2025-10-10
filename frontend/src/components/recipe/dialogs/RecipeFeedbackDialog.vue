<template>
    <v-dialog v-model="dialogStore.dialogs.recipeFeedbackDialog">
        <v-card>
            <v-card-title>{{ languageStore.t('recipe.feedback.title') }}</v-card-title>
            <v-card-text>
                <div>
                    <div v-if="successMessage" v-html="successMessage" class="mt-3 text-success"> </div>
                    <v-textarea v-else v-model="feedbackText" :label="languageStore.t('recipe.feedback.label')" outlined
                        rows="5" dense class="mt-5" clearable></v-textarea>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="closeSheet">{{ languageStore.t('general.close') }}</v-btn>
                <v-btn color="primary" v-if="!successMessage" @click="sendFeedback">{{
                    languageStore.t('general.send') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';
import { useRecipeStore } from '@/stores/recipeStore';

const dialogStore = useDialogStore();
const languageStore = useLanguageStore();
const recipeStore = useRecipeStore();
const feedbackText = ref('');
const successMessage = ref('');

const sendFeedback = () => {
    if (!feedbackText.value.trim()) {
        successMessage.value = languageStore.t('recipe.feedback.empty.text'); // Fehler bei leerem Feedback
        return;
    }

    recipeStore.createFeedback(recipeStore.currentRecipe._id, feedbackText.value);
    successMessage.value = languageStore.t('recipe.feedback.success'); // Erfolgsnachricht setzen
    feedbackText.value = ''; // Feedback-Feld zurücksetzen
};

const closeSheet = () => {
    dialogStore.closeDialog('recipeFeedbackDialog');
    successMessage.value = ''; // Erfolgsnachricht zurücksetzen
    feedbackText.value = ''; // Feedback zurücksetzen
};
</script>
