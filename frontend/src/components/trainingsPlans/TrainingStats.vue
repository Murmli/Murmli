<template>
  <v-expansion-panels variant="accordion" class="my-5">
    <v-expansion-panel>
      <v-expansion-panel-title>
        {{ languageStore.t('trainingPlans.statistics') }}
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <div v-if="loading">{{ languageStore.t('general.loading') }}</div>
        <div v-if="!loading && stats">
          <p><strong>{{ languageStore.t('trainingPlans.totalWorkouts') }}:</strong> {{ stats.totalWorkouts }}</p>
          <div v-if="stats.lastWorkout">
            <p><strong>{{ languageStore.t('trainingPlans.lastWorkout') }}:</strong> {{ new
              Date(stats.lastWorkout.date).toLocaleDateString() }} - {{ stats.lastWorkout.name }}</p>
            <v-list dense>
              <v-list-item-title>{{ languageStore.t('trainingPlans.lastExercises') }}:</v-list-item-title>
              <v-list-item v-for="(exercise, index) in stats.lastExercises" :key="index">
                <v-list-item-title>{{ exercise.name }}</v-list-item-title>
                <v-list-item-subtitle v-if="exercise.weight">{{ exercise.weight }} kg</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>
          <div v-else>
            <p>{{ languageStore.t('trainingPlans.noWorkoutsYet') }}</p>
          </div>
        </div>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useTrainingStore } from '@/stores/trainingStore';
import { useLanguageStore } from '@/stores/languageStore';

const trainingStore = useTrainingStore();
const languageStore = useLanguageStore();
const stats = ref(null);
const loading = ref(true);

onMounted(async () => {
  stats.value = await trainingStore.fetchTrainingStats();
  loading.value = false;
});
</script>
