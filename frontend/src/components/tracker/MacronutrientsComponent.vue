<template>
  <div v-if="hasMacroData">
    <v-expansion-panels>
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{ languageStore.t('tracker.macronutrients') }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <!-- Kohlenhydrate (grün) -->
          <v-row class="mb-2 align-center">
            <v-col cols="3" class="text-right text-caption">
              {{ languageStore.t('tracker.carbs') }}:
            </v-col>
            <v-col cols="9">
              <v-progress-linear :model-value="carbsPercentage" height="20" rounded
                bg-color="green-lighten-4 opacity-75" color="green-darken-1 opacity-75">
                <template v-slot:default>
                  <span class="font-weight-medium">
                    {{ trackerStore.tracker?.totals?.carbohydrates || 0 }}g /
                    {{ trackerStore.tracker?.recommendations?.carbohydrates || 0 }}g
                  </span>
                </template>
              </v-progress-linear>
            </v-col>
          </v-row>

          <!-- Fett (gelb) -->
          <v-row class="mb-2 align-center">
            <v-col cols="3" class="text-right text-caption">
              {{ languageStore.t('tracker.fat') }}:
            </v-col>
            <v-col cols="9">
              <v-progress-linear :model-value="fatPercentage" height="20" rounded bg-color="yellow-lighten-4 opacity-75"
                color="yellow-darken-1 opacity-75">
                <template v-slot:default>
                  <span class="font-weight-medium">
                    {{ trackerStore.tracker?.totals?.fat || 0 }}g /
                    {{ trackerStore.tracker?.recommendations?.fat || 0 }}g
                  </span>
                </template>
              </v-progress-linear>
            </v-col>
          </v-row>

          <!-- Eiweiß (blau) -->
          <v-row class="align-center">
            <v-col cols="3" class="text-right text-caption">
              {{ languageStore.t('tracker.protein') }}:
            </v-col>
            <v-col cols="9">
              <v-progress-linear :model-value="proteinPercentage" height="20" rounded
                bg-color="blue-lighten-4 opacity-75" color="light-blue-lighten-1 opacity-75">
                <template v-slot:default>
                  <span class="font-weight-medium">
                    {{ trackerStore.tracker?.totals?.protein || 0 }}g /
                    {{ trackerStore.tracker?.recommendations?.protein || 0 }}g
                  </span>
                </template>
              </v-progress-linear>
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useTrackerStore } from '@/stores/trackerStore';
import { useLanguageStore } from '@/stores/languageStore';

const trackerStore = useTrackerStore();
const languageStore = useLanguageStore();

// Prüfen, ob Makronährstoff-Daten vorhanden sind
const hasMacroData = computed(() => {
  return trackerStore.tracker?.recommendations?.carbohydrates > 0 ||
    trackerStore.tracker?.recommendations?.fat > 0 ||
    trackerStore.tracker?.recommendations?.protein > 0;
});

// Prozentsatz für Kohlenhydrate berechnen
const carbsPercentage = computed(() => {
  const totalCarbs = trackerStore.tracker?.totals?.carbohydrates || 0;
  const recommendedCarbs = trackerStore.tracker?.recommendations?.carbohydrates || 0;
  if (recommendedCarbs === 0) return 0;
  return Math.min((totalCarbs / recommendedCarbs) * 100, 100);
});

// Prozentsatz für Fett berechnen
const fatPercentage = computed(() => {
  const totalFat = trackerStore.tracker?.totals?.fat || 0;
  const recommendedFat = trackerStore.tracker?.recommendations?.fat || 0;
  if (recommendedFat === 0) return 0;
  return Math.min((totalFat / recommendedFat) * 100, 100);
});

// Prozentsatz für Protein berechnen
const proteinPercentage = computed(() => {
  const totalProtein = trackerStore.tracker?.totals?.protein || 0;
  const recommendedProtein = trackerStore.tracker?.recommendations?.protein || 0;
  if (recommendedProtein === 0) return 0;
  return Math.min((totalProtein / recommendedProtein) * 100, 100);
});
</script>
