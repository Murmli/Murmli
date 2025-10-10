<template>
    <v-overlay v-model="dialogStore.dialogs.plannerHelpWindow" class="align-center justify-center" contained persistent>
        <v-card class="mx-auto" max-width="90%">
            <v-card-title class="text-h6 font-weight-regular justify-space-between">
                <span>{{ currentTitle }}</span>
            </v-card-title>

            <v-window v-model="step">
                <!-- Welcome Screen (Step 1 - Filter Button) -->
                <v-window-item :value="1">
                    <v-card-text class="text-center">
                        <p v-html="languageStore.t('help.planner.welcome')"></p>
                        <v-btn class="mt-5" color="primary" @click="openFilter">
                            {{ languageStore.t('help.planner.openFilter') }}
                        </v-btn>
                    </v-card-text>
                </v-window-item>

                <!-- Rezeptauswahl (Step 2 - Rezepte auswählen) -->
                <v-window-item :value="2">
                    <v-card-text class="text-center">
                        <p v-html="languageStore.t('help.planner.options')"></p>
                    </v-card-text>
                </v-window-item>

                <!-- Einkaufsliste und Rezepte (Step 3) -->
                <v-window-item :value="3">
                    <v-card-text class="text-center">
                        <p v-html="languageStore.t('help.planner.shoppinglist')"></p>
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
import { usePlannerStore } from '@/stores/plannerStore';

const languageStore = useLanguageStore();
const dialogStore = useDialogStore();
const plannerStore = usePlannerStore();

const step = ref(1);

const currentTitle = computed(() => {
    switch (step.value) {
        case 1: return languageStore.t('help.planner.welcomeTitle');
        case 2: return languageStore.t('help.planner.optionsTitle');
        default: return languageStore.t('help.planner.shoppinglistTitle');
    }
});

const openFilter = () => {
    dialogStore.openDialog('plannerFilterDialog');
};

const closeWelcomeWindow = async () => {
    dialogStore.closeDialog('plannerHelpWindow');
    localStorage.setItem('showPlannerHelpWindow', 'false');
    await plannerStore.fetchRecipeSuggestions();
};

onMounted(() => {
    const showWelcomeWindow = localStorage.getItem('showPlannerHelpWindow');
    if (!showWelcomeWindow) {
        dialogStore.openDialog('plannerHelpWindow');
    }
});
</script>
