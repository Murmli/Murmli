<template>
  <TrainingStats />
  <TrainingPlansHelpWindow />
  <ActualTrainingPlans class="mt-5" />
  <ArchivedTrainingPlans />

  <div v-if="!trainingStore.trainingPlans || !trainingStore.trainingPlans.length" class="my-5">
    <v-alert type="info" color="primary" icon="mdi-information-outline">
      {{ languageStore.t('trainingPlans.noPlansInfo') }}
    </v-alert>
  </div>
</template>

<route lang="yaml">
  meta:
    layout: trainingPlansLayout
</route>

<script setup>
import { onMounted } from 'vue';
import { useTrainingStore } from '@/stores/trainingStore';
import { useLanguageStore } from '@/stores/languageStore';
import TrainingStats from '@/components/trainingsPlans/TrainingStats.vue';

const trainingStore = useTrainingStore();
const languageStore = useLanguageStore();

onMounted(() => {
  trainingStore.loadCache();
  trainingStore.fetchTrainingPlans();
});
</script>