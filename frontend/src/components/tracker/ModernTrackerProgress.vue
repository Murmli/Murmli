<template>
  <v-card class="modern-tracker-card pa-3" elevation="1">
    <v-row no-gutters align="center">
      <!-- Left Column: Carbs (Top) and Fat (Bottom) -->
      <v-col cols="3" class="d-flex flex-column justify-space-between" style="height: 140px;">
        <div class="macro-box">
          <div class="macro-label text-caption text-green-darken-2">
            {{ languageStore.t('tracker.carbs') }}
          </div>
          <v-progress-linear
            :model-value="getMacroPercentage('carbohydrates')"
            color="green"
            height="4"
            rounded
            class="my-1"
          ></v-progress-linear>
          <div class="macro-value text-caption">
            {{ Math.round(trackerStore.tracker?.totals?.carbohydrates || 0) }}g / {{ Math.round(trackerStore.tracker?.recommendations?.carbohydrates || 0) }}g
          </div>
        </div>
        
        <div class="macro-box">
          <div class="macro-label text-caption text-amber-darken-2">
            {{ languageStore.t('tracker.fat') }}
          </div>
          <v-progress-linear
            :model-value="getMacroPercentage('fat')"
            color="amber"
            height="4"
            rounded
            class="my-1"
          ></v-progress-linear>
          <div class="macro-value text-caption">
            {{ Math.round(trackerStore.tracker?.totals?.fat || 0) }}g / {{ Math.round(trackerStore.tracker?.recommendations?.fat || 0) }}g
          </div>
        </div>
      </v-col>

      <!-- Center Column: Larger Donut Chart -->
      <v-col cols="6" class="d-flex flex-column align-center justify-center">
        <div class="donut-container">
          <svg viewBox="0 0 100 100" class="donut-svg">
            <!-- Background track circle -->
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="transparent"
              stroke="#f5f5f5"
              stroke-width="6"
            />
            <!-- Progress circle (Solid) -->
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="transparent"
              :stroke="dynamicStrokeColor"
              stroke-width="7"
              stroke-dasharray="276.46"
              :stroke-dashoffset="consumedDashOffset"
              stroke-linecap="round"
              transform="rotate(-90 50 50)"
              style="transition: stroke 0.5s ease, stroke-dashoffset 0.5s ease"
            />
          </svg>
          <div class="donut-content text-center">
            <div class="donut-value text-h4 font-weight-medium" :class="remainingKcal < 0 ? 'text-red' : 'text-grey-darken-3'">
              {{ remainingKcal }}
            </div>
            <div class="text-caption text-grey mt-n1">
              {{ languageStore.t('tracker.kcal') }} {{ remainingKcal < 0 ? 'drüber' : 'übrig' }}
            </div>
          </div>
        </div>
        <!-- Consumed / Goal detail below donut -->
        <div class="text-caption text-grey-darken-1 mt-2">
          <span class="font-weight-bold text-grey-darken-3">{{ Math.round(totalKcal) }}</span> 
          / {{ Math.round(targetKcal) }} kcal
        </div>
      </v-col>

      <!-- Right Column: Protein (Top) and Info Button (Bottom) -->
      <v-col cols="3" class="d-flex flex-column justify-space-between align-end" style="height: 140px;">
        <div class="macro-box text-right w-100">
          <div class="macro-label text-caption text-blue-darken-2">
            {{ languageStore.t('tracker.protein') }}
          </div>
          <v-progress-linear
            :model-value="getMacroPercentage('protein')"
            color="blue"
            height="4"
            rounded
            class="my-1"
          ></v-progress-linear>
          <div class="macro-value text-caption">
            {{ Math.round(trackerStore.tracker?.totals?.protein || 0) }}g / {{ Math.round(trackerStore.tracker?.recommendations?.protein || 0) }}g
          </div>
        </div>

        <div class="info-btn-box">
          <v-btn
            icon="mdi-information-outline"
            variant="text"
            size="small"
            color="grey-darken-1"
            @click="showDetails = true"
          ></v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Details Dialog (PRAL & Histamine) -->
    <v-dialog v-model="showDetails" max-width="400">
      <v-card rounded="xl" class="pa-4">
        <v-card-title class="d-flex justify-space-between align-center px-0">
          <span class="text-h6 font-weight-bold">{{ languageStore.t('general.moreInfo') || 'Mehr Informationen' }}</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="showDetails = false"></v-btn>
        </v-card-title>
        
        <v-card-text class="px-0 pb-0">
          <!-- Acid-Base (PRAL) -->
          <div v-if="trackerStore.isIndicatorEnabled('acidBase')" class="mb-6">
            <div class="d-flex justify-space-between align-center mb-1">
              <span class="text-body-2 font-weight-medium">{{ languageStore.t('tracker.acidBaseBalance') }}</span>
              <v-chip size="small" :color="acidBaseColor" variant="tonal" class="font-weight-bold">
                {{ acidBaseLabel }}
              </v-chip>
            </div>
            <div class="text-caption text-grey">
              PRAL-Wert: {{ trackerStore.tracker?.totals?.acidBaseScore?.toFixed(2) || 0 }} mEq
            </div>
          </div>

          <!-- Histamine -->
          <div v-if="trackerStore.isIndicatorEnabled('histamine')">
            <div class="d-flex justify-space-between align-center mb-1">
              <span class="text-body-2 font-weight-medium">{{ languageStore.t('tracker.histamine.label') }}</span>
              <v-chip size="small" :color="histamineColor" variant="tonal" class="font-weight-bold">
                {{ histamineLabel }}
              </v-chip>
            </div>
            <div class="text-caption text-grey">
              {{ languageStore.t('tracker.histamine.description') }}
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="px-0 pt-6">
          <v-btn block color="primary" variant="flat" rounded="lg" @click="showDetails = false">
            {{ languageStore.t('general.close') || 'Schließen' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useTrackerStore } from '@/stores/trackerStore';
import { useLanguageStore } from '@/stores/languageStore';

const trackerStore = useTrackerStore();
const languageStore = useLanguageStore();

const showDetails = ref(false);

const totalKcal = computed(() => trackerStore.tracker?.totals?.kcal || 0);
const targetKcal = computed(() => trackerStore.tracker?.recommendations?.kcal || 2000);
const remainingKcal = computed(() => Math.round(targetKcal.value - totalKcal.value));

// SVG calculations (Circumference of r=44 is 2 * PI * 44 ≈ 276.46)
const circumference = 276.46;

// Consumed up to 100%
const consumedPercentage = computed(() => {
  if (targetKcal.value === 0) return 0;
  return Math.min(totalKcal.value / targetKcal.value, 1);
});

const consumedDashOffset = computed(() => {
  return circumference * (1 - consumedPercentage.value);
});

const getMacroPercentage = (key) => {
  const current = trackerStore.tracker?.totals?.[key] || 0;
  const target = trackerStore.tracker?.recommendations?.[key] || 0;
  if (target === 0) return 0;
  return Math.min((current / target) * 100, 100);
};

/**
 * Calculates a dynamic color for the donut stroke based on proximity to target.
 */
const dynamicStrokeColor = computed(() => {
  if (targetKcal.value === 0) return '#FF9800';
  
  const deviation = Math.abs(totalKcal.value - targetKcal.value) / targetKcal.value;
  
  const darkGreen = [46, 125, 50];  // #2E7D32
  const yellow = [251, 192, 45];     // #FBC02D
  const orange = [255, 152, 0];      // #FF9800

  let r, g, b;
  if (deviation <= 0.25) {
    const t = deviation / 0.25;
    r = Math.round(darkGreen[0] + t * (yellow[0] - darkGreen[0]));
    g = Math.round(darkGreen[1] + t * (yellow[1] - darkGreen[1]));
    b = Math.round(darkGreen[2] + t * (yellow[2] - darkGreen[2]));
  } else {
    const t = Math.min((deviation - 0.25) / 0.25, 1);
    r = Math.round(yellow[0] + t * (orange[0] - yellow[0]));
    g = Math.round(yellow[1] + t * (orange[1] - yellow[1]));
    b = Math.round(yellow[2] + t * (orange[2] - yellow[2]));
  }
  return `rgb(${r}, ${g}, ${b})`;
});

// PRAL Logic
const acidBaseScore = computed(() => trackerStore.tracker?.totals?.acidBaseScore || 0);
const acidBaseLabel = computed(() => {
  if (acidBaseScore.value < -5) return languageStore.t('tracker.acidBase.alkaline');
  if (acidBaseScore.value > 5) return languageStore.t('tracker.acidBase.acidic');
  return languageStore.t('tracker.acidBase.neutral');
});
const acidBaseColor = computed(() => {
  if (acidBaseScore.value < -5) return 'green-darken-1';
  if (acidBaseScore.value > 5) return 'red-darken-1';
  return 'amber-darken-1';
});

// Histamine Logic
const histamineAvg = computed(() => trackerStore.tracker?.totals?.histamineAvg || 0);
const histamineLabel = computed(() => {
  const avg = histamineAvg.value;
  if (avg <= 1) return languageStore.t('tracker.histamine.low');
  if (avg <= 2) return languageStore.t('tracker.histamine.moderate');
  return languageStore.t('tracker.histamine.high');
});
const histamineColor = computed(() => {
  const avg = histamineAvg.value;
  if (avg <= 1) return 'green-darken-1';
  if (avg <= 2) return 'amber-darken-1';
  return 'red-darken-1';
});
</script>

<style scoped>
.modern-tracker-card {
  border-radius: 20px;
  background: #ffffff;
}

.donut-container {
  position: relative;
  width: 140px;
  height: 140px;
}

.donut-svg {
  width: 100%;
  height: 100%;
}

.donut-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
}

.macro-box {
    margin-bottom: 8px;
}

.macro-label {
    text-transform: uppercase;
    font-size: 0.65rem !important;
    letter-spacing: 0.5px;
    line-height: 1.2;
}

.macro-value {
    font-size: 0.75rem !important;
    line-height: 1.1;
    color: #616161;
}

.w-100 {
    width: 100%;
}

.info-btn-box {
    margin-right: -8px;
    margin-bottom: -8px;
}
</style>
