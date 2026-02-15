<template>
  <div v-if="hasMacroData">
    <v-expansion-panels>
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{ languageStore.t('tracker.nutritionDetails') }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <!-- Makronährstoffe Überschrift -->
          <div class="text-caption font-weight-bold mb-2">
            {{ languageStore.t('tracker.macronutrients') }}
          </div>

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
          <v-row class="mb-2 align-center">
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

          <!-- Dynamic indicator sections based on settings -->
          <template v-for="indicator in enabledIndicators" :key="indicator.key">

            <!-- Säure-Basen-Haushalt -->
            <template v-if="indicator.key === 'acidBase'">
              <v-divider class="my-3" />
              <div class="text-caption font-weight-bold mb-2">
                {{ languageStore.t('tracker.acidBase.title') }}
              </div>
              <v-row class="mb-2 align-center">
                <v-col cols="3" class="text-right text-caption">
                  PRAL:
                </v-col>
                <v-col cols="9">
                  <div class="d-flex align-center">
                    <v-progress-linear
                      :model-value="acidBaseBarValue"
                      height="20"
                      rounded
                      :bg-color="acidBaseScore >= 0 ? 'orange-lighten-4 opacity-75' : 'teal-lighten-4 opacity-75'"
                      :color="acidBaseScore >= 0 ? 'orange-darken-1 opacity-75' : 'teal-darken-1 opacity-75'"
                    >
                      <template v-slot:default>
                        <span class="font-weight-medium">
                          {{ acidBaseScore }} mEq
                        </span>
                      </template>
                    </v-progress-linear>
                  </div>
                </v-col>
              </v-row>
              <v-row class="mb-1 align-center">
                <v-col cols="12">
                  <div class="text-caption text-center" :class="acidBaseTextColor">
                    <v-icon size="x-small" class="mr-1">{{ acidBaseIcon }}</v-icon>
                    {{ acidBaseLabel }}
                  </div>
                </v-col>
              </v-row>
            </template>

            <!-- Histamin -->
            <template v-if="indicator.key === 'histamine'">
              <v-divider class="my-3" />
              <div class="text-caption font-weight-bold mb-2">
                {{ languageStore.t('tracker.histamine.title') }}
              </div>
              <v-row class="mb-2 align-center">
                <v-col cols="3" class="text-right text-caption">
                  {{ languageStore.t('tracker.histamine.average') }}:
                </v-col>
                <v-col cols="9">
                  <v-progress-linear
                    :model-value="histamineBarValue"
                    height="20"
                    rounded
                    :bg-color="histamineBarBgColor"
                    :color="histamineBarColor"
                  >
                    <template v-slot:default>
                      <span class="font-weight-medium">
                        {{ histamineAvg }} / 3
                      </span>
                    </template>
                  </v-progress-linear>
                </v-col>
              </v-row>
              <v-row class="mb-1 align-center">
                <v-col cols="12">
                  <div class="text-caption text-center" :class="histamineTextColor">
                    <v-icon size="x-small" class="mr-1">{{ histamineIcon }}</v-icon>
                    {{ histamineLabel }}
                  </div>
                </v-col>
              </v-row>
            </template>

          </template>

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

// Enabled indicators from settings (respects order)
const enabledIndicators = computed(() => trackerStore.getEnabledIndicators());

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

// Säure-Basen-Haushalt
const acidBaseScore = computed(() => {
  return trackerStore.tracker?.totals?.acidBaseScore || 0;
});

// Bar value: Map acid-base score to 0-100 range for visualization
// Range: -50 (very alkaline) to +50 (very acidic), centered at 50%
const acidBaseBarValue = computed(() => {
  const score = acidBaseScore.value;
  // Clamp score between -50 and 50, map to 0-100
  const clamped = Math.max(-50, Math.min(50, score));
  return ((clamped + 50) / 100) * 100;
});

const acidBaseTextColor = computed(() => {
  const score = acidBaseScore.value;
  if (score <= -5) return 'text-teal-darken-2';
  if (score <= 5) return 'text-grey-darken-1';
  return 'text-orange-darken-2';
});

const acidBaseIcon = computed(() => {
  const score = acidBaseScore.value;
  if (score <= -5) return 'mdi-ph';
  if (score <= 5) return 'mdi-scale-balance';
  return 'mdi-ph';
});

const acidBaseLabel = computed(() => {
  const score = acidBaseScore.value;
  if (score <= -5) return languageStore.t('tracker.acidBase.alkaline');
  if (score <= 5) return languageStore.t('tracker.acidBase.balanced');
  return languageStore.t('tracker.acidBase.acidic');
});

// Histamin
const histamineAvg = computed(() => {
  return trackerStore.tracker?.totals?.histamineAvg || 0;
});

const histamineBarValue = computed(() => {
  return (histamineAvg.value / 3) * 100;
});

const histamineBarBgColor = computed(() => {
  const avg = histamineAvg.value;
  if (avg <= 1) return 'green-lighten-4 opacity-75';
  if (avg <= 2) return 'amber-lighten-4 opacity-75';
  return 'red-lighten-4 opacity-75';
});

const histamineBarColor = computed(() => {
  const avg = histamineAvg.value;
  if (avg <= 1) return 'green-darken-1 opacity-75';
  if (avg <= 2) return 'amber-darken-1 opacity-75';
  return 'red-darken-1 opacity-75';
});

const histamineTextColor = computed(() => {
  const avg = histamineAvg.value;
  if (avg <= 1) return 'text-green-darken-2';
  if (avg <= 2) return 'text-amber-darken-2';
  return 'text-red-darken-2';
});

const histamineIcon = computed(() => {
  const avg = histamineAvg.value;
  if (avg <= 1) return 'mdi-molecule';
  if (avg <= 2) return 'mdi-molecule';
  return 'mdi-molecule';
});

const histamineLabel = computed(() => {
  const avg = histamineAvg.value;
  if (avg <= 1) return languageStore.t('tracker.histamine.low');
  if (avg <= 2) return languageStore.t('tracker.histamine.moderate');
  return languageStore.t('tracker.histamine.high');
});
</script>
