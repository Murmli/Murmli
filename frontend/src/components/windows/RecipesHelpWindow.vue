<template>
    <v-overlay v-model="dialogStore.dialogs.recipesHelpWindow" class="align-center justify-center" contained persistent>
        <v-card class="mx-auto" max-width="90%">
            <v-card-title class="text-h6 font-weight-regular justify-space-between">
                <span>{{ currentTitle }}</span>
            </v-card-title>

            <v-window v-model="step">
                <!-- Schritt 1 - Übersicht über Rezepte -->
                <v-window-item :value="1">
                    <v-card-text class="text-center">
                        <p v-html="languageStore.t('help.recipes.overview')"></p>
                    </v-card-text>
                </v-window-item>

                <!-- Schritt 2 - Eigene Rezepte erstellen -->
                <v-window-item :value="2">
                    <v-card-text class="text-center">
                        <p v-html="languageStore.t('help.recipes.create')"></p>
                    </v-card-text>
                </v-window-item>

                <!-- Schritt 3 - Rezepte zur Einkaufsliste hinzufügen -->
                <v-window-item :value="3">
                    <v-card-text class="text-center">
                        <p v-html="languageStore.t('help.recipes.addToList')"></p>
                        <v-btn class="mt-5" color="primary" @click="closeWelcomeWindow">
                            {{ languageStore.t('general.start') }}
                        </v-btn>
                    </v-card-text>
                </v-window-item>
            </v-window>

            <v-divider></v-divider>

            <v-card-actions>
                <v-btn v-if="step > 1" variant="text" @click="step--">
                    {{ languageStore.t('general.back') }}
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn v-if="step < 3" color="primary" variant="flat" @click="step++">
                    {{ languageStore.t('general.next') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-overlay>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';

const languageStore = useLanguageStore();
const dialogStore = useDialogStore();

const step = ref(1);

const currentTitle = computed(() => {
    switch (step.value) {
        case 1: return languageStore.t('help.recipes.overviewTitle');
        case 2: return languageStore.t('help.recipes.createTitle');
        default: return languageStore.t('help.recipes.addToListTitle');
    }
});

const closeWelcomeWindow = () => {
    dialogStore.closeDialog('recipesHelpWindow');
    localStorage.setItem('showRecipesHelpWindow', 'false');
};

onMounted(() => {
    const showWelcomeWindow = localStorage.getItem('showRecipesHelpWindow');
    if (!showWelcomeWindow) {
        dialogStore.openDialog('recipesHelpWindow');
    }
});
</script>
