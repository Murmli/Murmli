<template>
    <v-dialog v-model="dialogStore.dialogs.calorieGoalDialog" max-width="600">
        <v-card>
            <v-card-title>{{ languageStore.t('tracker.calorieGoal') }}</v-card-title>
            <v-card-text class="justify-center text-center">
                <v-text-field v-model="recommendations.kcal" :label="languageStore.t('tracker.calorieGoal')"
                    type="number" clearable></v-text-field>

                <v-expansion-panels class="mb-6">
                    <v-expansion-panel elevation="0" border>
                        <v-expansion-panel-title class="px-3">
                            <div class="w-100">
                                <div class="d-flex justify-space-between align-center mb-2">
                                    <span class="text-subtitle-2 font-weight-bold">
                                        {{ languageStore.t('tracker.macros') || 'Makros' }}
                                        <span class="text-caption text-grey ml-1 font-weight-regular">
                                            (Summe: {{ macroKcalSum }} kcal)
                                        </span>
                                    </span>
                                </div>
                                
                                <!-- Multi-segment bar -->
                                <div class="macro-bar-container mb-2">
                                    <div class="macro-segment protein" :style="{ width: getMacroDistribution('protein') + '%' }"></div>
                                    <div class="macro-segment carbs" :style="{ width: getMacroDistribution('carbohydrates') + '%' }"></div>
                                    <div class="macro-segment fat" :style="{ width: getMacroDistribution('fat') + '%' }"></div>
                                </div>

                                <!-- Summary values -->
                                <div class="d-flex justify-space-between text-caption px-1">
                                    <div class="d-flex align-center">
                                        <div class="dot protein mr-1"></div>
                                        <span class="font-weight-bold">{{ recommendations.protein }}g</span>
                                        <span class="text-grey ml-1">({{ calculatePercentage(recommendations.protein, 4) }}%)</span>
                                    </div>
                                    <div class="d-flex align-center">
                                        <div class="dot carbs mr-1"></div>
                                        <span class="font-weight-bold">{{ recommendations.carbohydrates }}g</span>
                                        <span class="text-grey ml-1">({{ calculatePercentage(recommendations.carbohydrates, 4) }}%)</span>
                                    </div>
                                    <div class="d-flex align-center">
                                        <div class="dot fat mr-1"></div>
                                        <span class="font-weight-bold">{{ recommendations.fat }}g</span>
                                        <span class="text-grey ml-1">({{ calculatePercentage(recommendations.fat, 9) }}%)</span>
                                    </div>
                                </div>
                            </div>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <!-- Sliders -->
                            <div class="macro-slider-item mb-4">
                                <div class="d-flex justify-space-between align-center mb-1">
                                    <div class="d-flex align-center">
                                        <div class="dot protein mr-2"></div>
                                        <span class="text-body-2 font-weight-medium">{{ languageStore.t('tracker.protein') }}</span>
                                    </div>
                                    <span class="text-body-2 font-weight-bold">
                                        {{ recommendations.protein }}g
                                        <span class="text-caption text-grey font-weight-regular ml-1">({{ calculatePercentage(recommendations.protein, 4) }}%)</span>
                                    </span>
                                </div>
                                <v-slider
                                    v-model="recommendations.protein"
                                    min="0"
                                    :max="Math.floor(recommendations.kcal / 4)"
                                    step="1"
                                    color="blue"
                                    hide-details
                                    track-size="6"
                                    thumb-size="18"
                                    @update:model-value="adjustMacros('protein')"
                                    class="custom-macro-slider"
                                ></v-slider>
                            </div>

                            <div class="macro-slider-item mb-4">
                                <div class="d-flex justify-space-between align-center mb-1">
                                    <div class="d-flex align-center">
                                        <div class="dot carbs mr-2"></div>
                                        <span class="text-body-2 font-weight-medium">{{ languageStore.t('tracker.carbohydrates') }}</span>
                                    </div>
                                    <span class="text-body-2 font-weight-bold">
                                        {{ recommendations.carbohydrates }}g
                                        <span class="text-caption text-grey font-weight-regular ml-1">({{ calculatePercentage(recommendations.carbohydrates, 4) }}%)</span>
                                    </span>
                                </div>
                                <v-slider
                                    v-model="recommendations.carbohydrates"
                                    min="0"
                                    :max="Math.floor(recommendations.kcal / 4)"
                                    step="1"
                                    color="green"
                                    hide-details
                                    track-size="6"
                                    thumb-size="18"
                                    @update:model-value="adjustMacros('carbohydrates')"
                                    class="custom-macro-slider"
                                ></v-slider>
                            </div>

                            <div class="macro-slider-item mb-2">
                                <div class="d-flex justify-space-between align-center mb-1">
                                    <div class="d-flex align-center">
                                        <div class="dot fat mr-2"></div>
                                        <span class="text-body-2 font-weight-medium">{{ languageStore.t('tracker.fat') }}</span>
                                    </div>
                                    <span class="text-body-2 font-weight-bold">
                                        {{ recommendations.fat }}g
                                        <span class="text-caption text-grey font-weight-regular ml-1">({{ calculatePercentage(recommendations.fat, 9) }}%)</span>
                                    </span>
                                </div>
                                <v-slider
                                    v-model="recommendations.fat"
                                    min="0"
                                    :max="Math.floor(recommendations.kcal / 9)"
                                    step="1"
                                    color="orange"
                                    hide-details
                                    track-size="6"
                                    thumb-size="18"
                                    @update:model-value="adjustMacros('fat')"
                                    class="custom-macro-slider"
                                ></v-slider>
                            </div>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>

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
    carbohydrates: 0,
    fat: 0
});

const getMacroDistribution = (nutrient) => {
    if (macroKcalSum.value === 0) return 0;
    const multiplier = nutrient === 'fat' ? 9 : 4;
    const grams = recommendations.value[nutrient] || 0;
    return (grams * multiplier / macroKcalSum.value) * 100;
};

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

const adjustmentHistory = ref(['protein', 'carbohydrates', 'fat']);

const adjustMacros = (changedNutrient) => {
    // Historie aktualisieren: Den aktuell geänderten Nährstoff ans Ende schieben
    adjustmentHistory.value = adjustmentHistory.value.filter(n => n !== changedNutrient);
    adjustmentHistory.value.push(changedNutrient);

    const targetKcal = recommendations.value.kcal || 0;
    
    while (macroKcalSum.value > targetKcal) {
        // Kandidaten für die Reduzierung finden (alle außer dem aktuell geänderten)
        // Wir reduzieren den, der in der Historie am weitesten vorne steht
        const candidates = adjustmentHistory.value.filter(n => n !== changedNutrient);
        
        let reduced = false;
        for (const nutrientToReduce of candidates) {
            if (recommendations.value[nutrientToReduce] > 0) {
                recommendations.value[nutrientToReduce]--;
                reduced = true;
                break; // Aus der For-Schleife raus, um macroKcalSum neu zu prüfen
            }
        }
        
        if (!reduced) break; // Nichts mehr zum Reduzieren da
    }
};

// Watcher für kcal um Makros proportional zu skalieren
watch(() => recommendations.value.kcal, (newKcal, oldKcal) => {
    if (!newKcal || newKcal <= 0 || !oldKcal || oldKcal <= 0) return;

    // Verhältnis berechnen
    const ratio = newKcal / oldKcal;

    // Proportional skalieren
    recommendations.value.protein = Math.round(recommendations.value.protein * ratio);
    recommendations.value.carbohydrates = Math.round(recommendations.value.carbohydrates * ratio);
    recommendations.value.fat = Math.round(recommendations.value.fat * ratio);

    // Rundungsdifferenzen ausgleichen, um exakt auf newKcal zu kommen
    let currentSum = macroKcalSum.value;
    let attempts = 0;
    while (currentSum !== newKcal && attempts < 20) {
        const diff = newKcal - currentSum;
        if (diff > 0) {
            // Summe zu niedrig -> Werte erhöhen (bevorzugt Carbs oder Protein)
            if (attempts % 2 === 0) recommendations.value.carbohydrates++;
            else recommendations.value.protein++;
        } else {
            // Summe zu hoch -> Werte senken
            if (recommendations.value.carbohydrates > 0) recommendations.value.carbohydrates--;
            else if (recommendations.value.fat > 0) recommendations.value.fat--;
            else if (recommendations.value.protein > 0) recommendations.value.protein--;
        }
        currentSum = macroKcalSum.value;
        attempts++;
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

<style scoped>
.macro-bar-container {
    display: flex;
    height: 10px;
    width: 100%;
    background-color: #f0f0f0;
    border-radius: 5px;
    overflow: hidden;
}

.macro-segment {
    height: 100%;
    transition: width 0.3s ease;
}

.macro-segment.protein { background-color: #2196F3; }
.macro-segment.carbs { background-color: #4CAF50; }
.macro-segment.fat { background-color: #FF9800; }

.dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

.dot.protein { background-color: #2196F3; }
.dot.carbs { background-color: #4CAF50; }
.dot.fat { background-color: #FF9800; }

.custom-macro-slider :deep(.v-slider-track__fill) {
    border-radius: 3px;
}

.custom-macro-slider :deep(.v-slider-track__background) {
    border-radius: 3px;
    opacity: 0.2;
}

.custom-macro-slider :deep(.v-slider-thumb__surface) {
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
</style>

