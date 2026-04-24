<template>
    <v-dialog v-model="dialogStore.dialogs.calorieGoalDialog" max-width="600">
        <v-card>
            <v-card-title>{{ languageStore.t('tracker.calorieGoal') }}</v-card-title>
            <v-card-text class="justify-center text-center">
                <v-text-field v-model="recommendations.kcal" :label="languageStore.t('tracker.calorieGoal')"
                    type="number" clearable></v-text-field>

                <div class="mt-2 mb-6 px-2">
                    <div class="d-flex justify-space-between align-center mb-1">
                        <span class="text-caption">{{ languageStore.t('tracker.protein') }}</span>
                        <span class="text-caption font-weight-bold">{{ recommendations.protein }}g ({{ calculatePercentage(recommendations.protein, 4) }}%)</span>
                    </div>
                    <v-slider
                        v-model="recommendations.protein"
                        min="0"
                        :max="Math.floor(recommendations.kcal / 4)"
                        step="1"
                        color="blue"
                        density="compact"
                        hide-details
                        @update:model-value="adjustMacros('protein')"
                        class="mb-4"
                    ></v-slider>

                    <div class="d-flex justify-space-between align-center mb-1">
                        <span class="text-caption">{{ languageStore.t('tracker.carbohydrates') }}</span>
                        <span class="text-caption font-weight-bold">{{ recommendations.carbohydrates }}g ({{ calculatePercentage(recommendations.carbohydrates, 4) }}%)</span>
                    </div>
                    <v-slider
                        v-model="recommendations.carbohydrates"
                        min="0"
                        :max="Math.floor(recommendations.kcal / 4)"
                        step="1"
                        color="green"
                        density="compact"
                        hide-details
                        @update:model-value="adjustMacros('carbohydrates')"
                        class="mb-4"
                    ></v-slider>

                    <div class="d-flex justify-space-between align-center mb-1">
                        <span class="text-caption">{{ languageStore.t('tracker.fat') }}</span>
                        <span class="text-caption font-weight-bold">{{ recommendations.fat }}g ({{ calculatePercentage(recommendations.fat, 9) }}%)</span>
                    </div>
                    <v-slider
                        v-model="recommendations.fat"
                        min="0"
                        :max="Math.floor(recommendations.kcal / 9)"
                        step="1"
                        color="orange"
                        density="compact"
                        hide-details
                        @update:model-value="adjustMacros('fat')"
                    ></v-slider>

                    <div class="mt-4 text-caption text-grey">
                        Summe: {{ macroKcalSum }} kcal (Ziel: {{ recommendations.kcal }} kcal)
                    </div>
                </div>

                <v-btn class="mb-9" color="primary" @click="saveCalorieGoal" :disabled="macroKcalDiff > 0">
                    {{ languageStore.t('tracker.calorieGoal') }} {{ languageStore.t('general.save') }}
                </v-btn>

                <!-- Warning message if required data is missing -->
                <v-alert v-if="missingRequiredData" type="warning" class="mb-5">
                    {{ languageStore.t('tracker.errorNoBodydata') }}
                </v-alert>

                <!-- Calorie calculation section - only shown if all required data is available -->
                <div v-else>
                    <v-select v-model="localBodyData.dietType" :items="trackerStore.dietTypeOptions"
                        :label="languageStore.t('tracker.dietType.text')" class="mb-3"></v-select>

                    <v-select v-model="localBodyData.dietLevel" :items="trackerStore.dietLevelOptions"
                        @update:model-value="onDietLevelChange"
                        :label="languageStore.t('tracker.dietLevel.text')" class="mb-3"></v-select>
                </div>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="closeDialog">{{ languageStore.t('general.close') }}</v-btn>
                </v-card-actions>
            </v-card-text>
        </v-card>
    </v-dialog>

    <!-- Bestätigungsdialog für Diät-Zähler-Reset -->
    <v-dialog v-model="showResetDialog" max-width="400" persistent>
        <v-card>
            <v-card-title>{{ languageStore.t('tracker.dietLevelChange.resetTitle') }}</v-card-title>
            <v-card-text>
                {{ languageStore.t('tracker.dietLevelChange.resetMessage') }}
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="secondary" @click="confirmReset(false)">{{ languageStore.t('tracker.dietLevelChange.resetNo') }}</v-btn>
                <v-btn color="primary" @click="confirmReset(true)">{{ languageStore.t('tracker.dietLevelChange.resetYes') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useTrackerStore } from '@/stores/trackerStore';
import { useDialogStore } from '@/stores/dialogStore';

const dialogStore = useDialogStore();
const languageStore = useLanguageStore();
const trackerStore = useTrackerStore();

const showResetDialog = ref(false);
const pendingDietLevel = ref(null);
const isUpdatingFromReset = ref(false);

// Lokale Kopie der Körperdaten
const localBodyData = ref({
    height: null,
    latestWeight: null,
    birthyear: null,
    gender: null,
    dietType: null,
    dietLevel: null,
    workHoursWeek: null,
    workDaysPAL: null
});

const recommendations = ref({
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0
});

const syncRecommendationsFromStore = () => {
    recommendations.value = {
        ...recommendations.value,
        ...(trackerStore.tracker.recommendations || {})
    };
};

const calculatePercentage = (grams, multiplier) => {
    if (!recommendations.value.kcal || recommendations.value.kcal <= 0) return 0;
    return Math.round(((grams * multiplier) / recommendations.value.kcal) * 100);
};

const macroKcalSum = computed(() => {
    return Math.round(
        (recommendations.value.protein || 0) * 4 +
        (recommendations.value.carbohydrates || 0) * 4 +
        (recommendations.value.fat || 0) * 9
    );
});

const macroKcalDiff = computed(() => {
    return macroKcalSum.value - (recommendations.value.kcal || 0);
});

const adjustMacros = (changedNutrient) => {
    const targetKcal = recommendations.value.kcal || 0;
    
    while (macroKcalSum.value > targetKcal) {
        if (changedNutrient === 'protein') {
            // Wenn Protein erhöht wird, kürze zuerst Carbs, dann Fett
            if (recommendations.value.carbohydrates > 0) recommendations.value.carbohydrates--;
            else if (recommendations.value.fat > 0) recommendations.value.fat--;
            else break;
        } else if (changedNutrient === 'carbohydrates') {
            // Wenn Carbs erhöht werden, kürze zuerst Fett, dann Protein
            if (recommendations.value.fat > 0) recommendations.value.fat--;
            else if (recommendations.value.protein > 0) recommendations.value.protein--;
            else break;
        } else if (changedNutrient === 'fat') {
            // Wenn Fett erhöht wird, kürze zuerst Carbs, dann Protein
            if (recommendations.value.carbohydrates > 0) recommendations.value.carbohydrates--;
            else if (recommendations.value.protein > 0) recommendations.value.protein--;
            else break;
        } else {
            break;
        }
    }
};

// Watcher für kcal um Makros bei Bedarf zu deckeln
watch(() => recommendations.value.kcal, (newKcal) => {
    if (macroKcalSum.value > newKcal) {
        // Einfaches Deckeln: Wenn die Summe zu hoch ist, werden alle Werte proportional oder nacheinander gekürzt.
        // Hier: Wir kürzen nacheinander, bis es passt
        while (macroKcalSum.value > newKcal) {
            if (recommendations.value.carbohydrates > 0) recommendations.value.carbohydrates--;
            else if (recommendations.value.fat > 0) recommendations.value.fat--;
            else if (recommendations.value.protein > 0) recommendations.value.protein--;
            else break;
        }
    }
});


// Check if required fields are missing
const missingRequiredData = computed(() => {
    return !trackerStore.bodyData.height ||
        !trackerStore.bodyData.latestWeight ||
        !trackerStore.bodyData.birthyear ||
        !trackerStore.bodyData.gender ||
        !trackerStore.bodyData.workHoursWeek ||
        !trackerStore.bodyData.workDaysPAL;
});

// Beim Öffnen des Dialogs Daten laden
onMounted(async () => {
    const fetchedData = await trackerStore.fetchBodyData();
    if (!localBodyData.value) {
        localBodyData.value = fetchedData;
    } else {
        Object.assign(localBodyData.value, fetchedData);
    }
    syncRecommendationsFromStore();
});

const calculateCalories = async () => {
    try {
        const response = await trackerStore.calculateRecommendations(
            localBodyData.value.workHoursWeek,
            localBodyData.value.workDaysPAL
        );
        if (response) {
            recommendations.value = {
                ...recommendations.value,
                ...response
            };
        }
    } catch (error) {
        console.error('Fehler beim Berechnen:', error);
    }
};

const saveCalorieGoal = async () => {
    try {
        await trackerStore.updateRecommendations(recommendations.value);
        syncRecommendationsFromStore();
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
    }
};

const closeDialog = () => {
    dialogStore.closeDialog('calorieGoalDialog');
};

const onDietLevelChange = (val) => {
    pendingDietLevel.value = val;
    showResetDialog.value = true;
};

const confirmReset = async (shouldReset) => {
    showResetDialog.value = false;
    isUpdatingFromReset.value = true;
    try {
        await trackerStore.updateBodyData({ 
            dietLevel: pendingDietLevel.value,
            resetDietCounter: shouldReset
        });
        // Automatische Berechnung nach Level-Änderung
        await calculateCalories();
    } catch (error) {
        console.error('Fehler beim Aktualisieren der DietLevel:', error);
    } finally {
        isUpdatingFromReset.value = false;
        pendingDietLevel.value = null;
    }
};

watch(
    () => dialogStore.dialogs.calorieGoalDialog,
    (isOpen) => {
        if (isOpen) {
            syncRecommendationsFromStore();
        }
    }
);

// Watcher für dietType
watch(
    () => localBodyData.value.dietType,
    async (newVal, oldVal) => {
        if (newVal !== oldVal) {
            try {
                // Hier rufst du deine Store-Action auf, die die API aktualisiert
                await trackerStore.updateBodyData({ dietType: newVal });
                // Automatische Berechnung nach Typ-Änderung
                await calculateCalories();
            } catch (error) {
                console.error('Fehler beim Aktualisieren der DietType:', error);
            }
        }
    }
);

// Watcher für dietLevel entfernen oder anpassen
// Wir entfernen ihn, da wir jetzt onDietLevelChange nutzen
</script>
