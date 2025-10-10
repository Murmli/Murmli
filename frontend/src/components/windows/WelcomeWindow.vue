<template>
    <v-overlay v-model="dialogStore.dialogs.welcomeWindow" class="align-center justify-center" persistent>
        <v-card class="mx-auto" max-width="90%">
            <v-card-title class="text-h6 font-weight-regular justify-space-between">
                <span>{{ currentTitle }}</span>
            </v-card-title>

            <v-window v-model="step" :touch="false">
                <!-- Step 1 - Language Selection -->
                <v-window-item :value="1">
                    <v-card-text class="text-center">
                        <p v-html="languageStore.t('help.shoppinglist.languagePrompt')"></p>
                        <LanguageSelect />
                        <StartpageSelect />
                    </v-card-text>
                </v-window-item>
                <!-- Step 2 - Planner Filter Setup -->
                <v-window-item :value="2">
                    <v-card-text class="text-center">
                        <p v-html="languageStore.t('help.planner.welcome')"></p>

                        <!-- Servings Slider -->
                        <div class="mt-4">
                            <p>{{ languageStore.t('planner.filter.servingsLabel') }}</p>
                            <v-slider v-model="plannerStore.filters.servings" :min="1" :max="12" step="1" ticks
                                tick-size="4">
                                <template v-slot:append>
                                    <v-text-field v-model="plannerStore.filters.servings" density="compact"
                                        style="width: 70px" type="number" hide-details single-line></v-text-field>
                                </template>
                            </v-slider>
                        </div>

                        <!-- Recipes Slider -->
                        <div class="mt-4">
                            <p>{{ languageStore.t('planner.filter.recipesLabel') }}</p>
                            <v-slider v-model="plannerStore.filters.recipes" :min="1" :max="7" step="1" ticks
                                tick-size="4">
                                <template v-slot:append>
                                    <v-text-field v-model="plannerStore.filters.recipes" density="compact"
                                        style="width: 70px" type="number" hide-details single-line></v-text-field>
                                </template>
                            </v-slider>
                        </div>

                        <!-- Prompt Textarea -->
                        <div class="mt-4">
                            <v-textarea v-model="plannerStore.filters.prompt" :label="promptPlaceholder" auto-grow
                                rows="2" clearable />
                        </div>
                    </v-card-text>
                </v-window-item>

                <!-- Step 3 - App Information and Finish -->
                <v-window-item :value="3">
                    <v-card-text class="pa-4 text-center">
                        <p v-html="languageStore.t('help.setup.aboutApp')"></p>
                        <v-btn class="mt-5" color="primary" @click="closeWelcomeWindow">{{
                            languageStore.t('help.shoppinglist.start')
                        }}</v-btn>
                    </v-card-text>
                </v-window-item>
            </v-window>

            <v-divider></v-divider>

            <v-card-actions>
                <v-btn v-if="step > 1" variant="text" @click="step--">
                    {{ languageStore.t('general.back') }}
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn v-if="step < 3" color="primary" variant="flat" @click="nextStep">
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

const promptPlaceholder = computed(() => languageStore.t('planner.filter.promptPlaceholder'));

const step = ref(1);



const currentTitle = computed(() => {
    switch (step.value) {
        case 1:
            return languageStore.t('help.shoppinglist.languageTitle');
        case 2:
            return languageStore.t('help.planner.welcomeTitle');
        default:
            return languageStore.t('help.setup.aboutAppTitle');
    }
});


const nextStep = () => {
    if (step.value === 2) {
        plannerStore.setFilters(plannerStore.filters);
        plannerStore.fetchRecipeSuggestions(false);
    }
    step.value++;
};

const closeWelcomeWindow = () => {
    dialogStore.closeDialog('welcomeWindow');
    localStorage.setItem('showWelcomeWindow', 'false');
    // Prevent other help windows from showing automatically
    localStorage.setItem('showPlannerHelpWindow', 'false');
    localStorage.setItem('showRecipesHelpWindow', 'false');
    localStorage.setItem('showTrackerHelpWindow', 'false');
    localStorage.setItem('showTrainingPlansHelpWindow', 'false');
};

onMounted(() => {
    plannerStore.fetchFilters();
    const showWelcomeWindow = localStorage.getItem('showWelcomeWindow');
    if (!showWelcomeWindow) {
        dialogStore.openDialog('welcomeWindow');
    }
});
</script>
