<template>
    <v-dialog v-model="dialogStore.dialogs.plannerFilterDialog">
        <v-card>
            <v-card-title>{{ languageStore.t('planner.filter.title') }}</v-card-title>
            <v-card-text>
                <!-- Servings Slider -->
                <div>
                    <p>{{ languageStore.t('planner.filter.servingsLabel') }}</p>
                    <v-slider v-model="plannerStore.filters.servings" :min="1" :max="12" step="1" ticks tick-size="4">
                        <template v-slot:append>
                            <v-text-field v-model="plannerStore.filters.servings" density="compact" style="width: 70px"
                                type="number" hide-details single-line></v-text-field>
                        </template>
                    </v-slider>
                </div>

                <!-- Recipes Slider -->
                <div class="mt-4">
                    <p>{{ languageStore.t('planner.filter.recipesLabel') }}</p>
                    <v-slider v-model="plannerStore.filters.recipes" :min="1" :max="7" step="1" ticks tick-size="4">
                        <template v-slot:append>
                            <v-text-field v-model="plannerStore.filters.recipes" density="compact" style="width: 70px"
                                type="number" hide-details single-line></v-text-field>
                        </template>
                    </v-slider>
                </div>

                <!-- Prompt Textarea -->
                <div class="mt-4">
                    <p>{{ languageStore.t('planner.filter.promptLabel') }}</p>
                    <v-textarea v-model="plannerStore.filters.prompt" :label="promptPlaceholder" auto-grow rows="2"
                        clearable />
                </div>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="saveFilters">{{ languageStore.t('general.save') }}</v-btn>
                <v-btn @click="closeSheet">{{ languageStore.t('general.cancel') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { onMounted } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { usePlannerStore } from '@/stores/plannerStore';
import { useDialogStore } from '@/stores/dialogStore';

const dialogStore = useDialogStore();
const languageStore = useLanguageStore();
const plannerStore = usePlannerStore();

const promptPlaceholder = languageStore.t('planner.filter.promptPlaceholder');

// Load initial filters
onMounted(async () => {
    plannerStore.fetchFilters(); // Load filters directly into the store
});

// Save filters and (conditionally) fetch recipe suggestions
const saveFilters = async () => {
    await plannerStore.setFilters(plannerStore.filters); // Use store filters directly
    // Only fetch recipe suggestions if the help window is not open
    if (!dialogStore.dialogs.plannerHelpWindow) {
        await plannerStore.fetchRecipeSuggestions();
    }
    closeSheet();
};

// Close the filter dialog
const closeSheet = () => {
    dialogStore.closeDialog('plannerFilterDialog');
};
</script>

<style scoped>
.mt-4 {
    margin-top: 16px;
}
</style>
