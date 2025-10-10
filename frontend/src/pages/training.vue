<template>
  <TrainingPlanOverview v-if="showPlanOverview" />
  <TrainingLog v-if="showExercise" />
  <TrainingLogSummary v-if="showSummary" />
</template>

<route lang="yaml">
  meta:
    layout: trainingLayout
</route>

<script setup>
import { onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useTrainingStore } from '@/stores/trainingStore';
import router from '@/router';
import { KeepAwake } from '@capacitor-community/keep-awake';

const route = useRoute();
const trainingsPlanId = computed(() => route.query.trainingsPlanId);
const trainingWeekday = computed(() => route.query.trainingWeekday);

const trainingStore = useTrainingStore();

const showPlanOverview = computed(() => trainingStore.currentLog?.status === 'preview' || trainingStore.currentLog?.status === 'canceled');
const showExercise = computed(() => trainingStore.currentLog?.status === 'in-progress');
const showSummary = computed(() => trainingStore.currentLog?.status === 'completed');

watch(showExercise, (newValue) => {
  if (newValue) {
    KeepAwake.keepAwake();
  } else {
    KeepAwake.allowSleep();
  }
});

onMounted(async () => {
  trainingStore.selectedPlanId = trainingsPlanId.value;
  trainingStore.selectedDay = trainingWeekday.value;

  if (trainingStore.selectedDay == null) {
    return router.push('/trainingPlans');
  }

  await trainingStore.fetchLatestTrainingLog();

  if (!trainingStore.latestLog) {
    const preview = await trainingStore.previewTrainingLog();
    if (preview) {
      trainingStore.currentLog = { ...preview, status: 'preview' };
      trainingStore.currentLogId = null;
    }
  } else if (
    ['preview', 'completed', 'canceled', 'aborted'].includes(
      trainingStore.latestLog.status
    )
  ) {
    trainingStore.currentLog = { ...trainingStore.latestLog, status: 'preview' };
    trainingStore.currentLogId = null;
  } else if (trainingStore.latestLog.status === 'in-progress') {
    trainingStore.currentLog = trainingStore.latestLog;
    trainingStore.currentLogId = trainingStore.latestLog._id;
  }

});
</script>
