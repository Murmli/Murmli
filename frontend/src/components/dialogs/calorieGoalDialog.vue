<template>
    <v-dialog v-model="dialogStore.dialogs.calorieGoalDialog" max-width="600">
        <v-card>
            <v-card-title>{{ languageStore.t('tracker.calorieGoal') }}</v-card-title>
            <v-card-text class="justify-center text-center">
                <v-text-field v-model="recommendations.kcal" :label="languageStore.t('tracker.calorieGoal')"
                    clearable></v-text-field>

                <v-btn class="mb-9" color="primary" @click="saveCalorieGoal">
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
                        :label="languageStore.t('tracker.dietLevel.text')" class="mb-3"></v-select>
                    <v-btn class="mb-5" color="primary" @click="calculateCalories">{{
                        languageStore.t('tracker.calculateCalories') }}</v-btn>
                </div>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="closeDialog">{{ languageStore.t('general.close') }}</v-btn>
                </v-card-actions>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useTrackerStore } from '@/stores/trackerStore';
import { useDialogStore } from '@/stores/dialogStore';

const dialogStore = useDialogStore();
const languageStore = useLanguageStore();
const trackerStore = useTrackerStore();

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
    recommendations.value.kcal = trackerStore.tracker.recommendations.kcal || 0;
});

const calculateCalories = async () => {
    try {
        const response = await trackerStore.calculateRecommendations(localBodyData.workHoursWeek, localBodyData.workDaysPAL);
        recommendations.value = response;
    } catch (error) {
        console.error('Fehler beim Berechnen:', error);
    }
};

const saveCalorieGoal = async () => {
    try {
        await trackerStore.updateRecommendations(recommendations.value);
        recommendations.kcal = trackerStore.tracker.recommendations.kcal || 0;
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
    }
};

const closeDialog = () => {
    dialogStore.closeDialog('calorieGoalDialog');
};

// Watcher für dietType
watch(
    () => localBodyData.value.dietType,
    async (newVal, oldVal) => {
        if (newVal !== oldVal) {
            try {
                // Hier rufst du deine Store-Action auf, die die API aktualisiert
                await trackerStore.updateBodyData({ dietType: newVal });
            } catch (error) {
                console.error('Fehler beim Aktualisieren der DietType:', error);
            }
        }
    }
);

// Watcher für dietLevel
watch(
    () => localBodyData.value.dietLevel,
    async (newVal, oldVal) => {
        if (newVal !== oldVal) {
            try {
                await trackerStore.updateBodyData({ dietLevel: newVal });
            } catch (error) {
                console.error('Fehler beim Aktualisieren der DietLevel:', error);
            }
        }
    }
);
</script>