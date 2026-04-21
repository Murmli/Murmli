<template>
  <v-card class="calorie-history-card pa-3 mb-5" elevation="1">
    <div class="d-flex justify-space-between align-center mb-4">
      <span class="text-subtitle-2 font-weight-bold text-grey-darken-3">
        {{ languageStore.t('tracker.history.title') || 'Kalorien der letzten 10 Tage' }}
      </span>
      <v-icon size="small" color="grey">mdi-history</v-icon>
    </div>

    <div class="chart-container">
      <div v-for="(day, index) in historyData" :key="index" class="chart-column">
        <div class="bar-wrapper">
          <!-- Background track -->
          <div class="bar-track"></div>
          
          <!-- Target line -->
          <div 
            class="target-line" 
            :style="{ bottom: getTargetPosition(day) + '%' }"
          ></div>

          <!-- Actual bar -->
          <div 
            class="bar-fill" 
            :style="{ 
              height: getBarHeight(day) + '%',
              backgroundColor: getBarColor(day)
            }"
          >
            <!-- Tooltip-like value (optional, shown on hover/touch) -->
            <div class="bar-value text-caption">{{ Math.round(day.kcal) }}</div>
          </div>
        </div>
        <div class="day-label text-caption text-grey">{{ getDayLabel(day.date) }}</div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useTrackerStore } from '@/stores/trackerStore';
import { useLanguageStore } from '@/stores/languageStore';

const trackerStore = useTrackerStore();
const languageStore = useLanguageStore();

const historyData = computed(() => {
  const data = trackerStore.history || [];
  const result = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Default target from user settings or 2000 as fallback
  const defaultTarget = trackerStore.bodyData?.recommendations?.kcal || 2000;

  for (let i = 9; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Find entry for this date (ignoring time)
    const entry = data.find(e => {
      const eDate = new Date(e.date).toISOString().split('T')[0];
      return eDate === dateStr;
    });

    if (entry) {
      result.push(entry);
    } else {
      result.push({
        date: d.toISOString(),
        kcal: 0,
        target: defaultTarget
      });
    }
  }
  return result;
});

onMounted(async () => {
  if (trackerStore.history.length === 0) {
    await trackerStore.fetchHistory();
  }
});

const getBarHeight = (day) => {
  const max = Math.max(...historyData.value.map(d => Math.max(d.kcal, d.target)), 2500);
  if (max === 0) return 0;
  return (day.kcal / max) * 100;
};

const getTargetPosition = (day) => {
  const max = Math.max(...historyData.value.map(d => Math.max(d.kcal, d.target)), 2500);
  if (max === 0) return 0;
  return (day.target / max) * 100;
};

const getBarColor = (day) => {
  if (day.target === 0) return '#4CAF50';
  const ratio = day.kcal / day.target;
  
  if (ratio <= 0.95) return '#4CAF50'; // Green (under)
  if (ratio <= 1.05) return '#8BC34A'; // Light Green (perfect)
  if (ratio <= 1.15) return '#FF9800'; // Amber (slightly over)
  return '#E53935'; // Red (over)
};

const getDayLabel = (dateStr) => {
  const date = new Date(dateStr);
  const days = ['S', 'M', 'D', 'M', 'D', 'F', 'S'];
  // Alternatively, use short day names from locale
  return date.toLocaleDateString(undefined, { weekday: 'narrow' });
};
</script>

<style scoped>
.calorie-history-card {
  border-radius: 20px;
  background: #ffffff;
}

.chart-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 120px;
  padding-bottom: 20px;
}

.chart-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
}

.bar-wrapper {
  position: relative;
  width: 12px;
  height: 100%;
  border-radius: 6px;
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.bar-track {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  border-radius: 6px;
}

.bar-fill {
  position: relative;
  width: 100%;
  border-radius: 6px;
  transition: height 0.5s ease, background-color 0.5s ease;
  z-index: 2;
}

.target-line {
  position: absolute;
  left: -2px;
  right: -2px;
  height: 2px;
  background-color: #9e9e9e;
  z-index: 3;
  opacity: 0.6;
}

.bar-value {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 2px 4px;
  border-radius: 4px;
  display: none;
  white-space: nowrap;
}

.chart-column:hover .bar-value {
  display: block;
}

.day-label {
  font-size: 0.65rem !important;
  font-weight: bold;
}
</style>
