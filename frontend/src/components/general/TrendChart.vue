<template>
  <div class="trend-chart-container">
    <div class="chart-area" :style="{ height: height + 'px' }">
      <!-- Zero line -->
      <div class="zero-line"></div>
      
      <!-- Bars -->
      <div v-for="(item, index) in data" :key="index" class="trend-bar-wrapper">
        <div 
          class="trend-bar" 
          :class="item.diff > 0 ? 'positive' : (item.diff < 0 ? 'negative' : 'neutral')"
          :style="{ 
            height: getBarHeight(item.diff) + '%',
            bottom: getBarBottom(item.diff) + '%'
          }"
        >
          <v-tooltip activator="parent" location="top" offset="5">
            <div class="text-caption">
              <strong>{{ formatDiff(item.diff) }}</strong><br>
              {{ formatDate(item.date) }}
            </div>
          </v-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => []
  },
  height: {
    type: Number,
    default: 50
  }
});

const maxAbsDiff = computed(() => {
  if (!props.data || !props.data.length) return 1;
  const max = Math.max(...props.data.map(d => Math.abs(d.diff)), 5); // Minimum 5 for scale
  return max;
});

const getBarHeight = (diff) => {
  if (diff === 0) return 2; // Small sliver for 0
  return (Math.abs(diff) / maxAbsDiff.value) * 45; // 45% to leave some margin
};

const getBarBottom = (diff) => {
  if (diff >= 0) return 50; // Starts at middle and goes up
  return 50 - getBarHeight(diff); // Starts below middle and goes up to middle
};

const formatDiff = (val) => {
  if (val === 0) return '0';
  return val > 0 ? `+${val}` : String(val);
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });
};
</script>

<style scoped>
.trend-chart-container {
  width: 100%;
  padding: 8px 0;
}
.chart-area {
  position: relative;
  display: flex;
  justify-content: space-around;
  align-items: stretch;
  background: rgba(0,0,0,0.02);
  border-radius: 8px;
  overflow: hidden;
  padding: 0 4px;
}
.zero-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(0,0,0,0.15);
  border-top: 1px dashed rgba(0,0,0,0.1);
  z-index: 1;
}
.trend-bar-wrapper {
  flex: 1;
  position: relative;
  height: 100%;
  display: flex;
  justify-content: center;
  max-width: 20px;
}
.trend-bar {
  position: absolute;
  width: 70%;
  min-width: 4px;
  border-radius: 2px;
  z-index: 2;
  transition: height 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), bottom 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.trend-bar.positive {
  background: linear-gradient(to top, #4CAF50, #81C784);
  box-shadow: 0 1px 3px rgba(76, 175, 80, 0.2);
}
.trend-bar.negative {
  background: linear-gradient(to bottom, #F44336, #E57373);
  box-shadow: 0 1px 3px rgba(244, 67, 54, 0.2);
}
.trend-bar.neutral {
  background-color: #BDBDBD;
  height: 2px !important;
  bottom: calc(50% - 1px) !important;
}

.trend-bar:hover {
  filter: brightness(1.1);
  transform: scaleX(1.1);
  z-index: 10;
}
</style>
