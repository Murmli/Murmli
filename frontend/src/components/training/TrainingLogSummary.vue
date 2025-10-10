<template>
  <v-container v-if="trainingStore.currentLog">
    <v-card class="mx-auto my-8" max-width="600">
      <v-card-title class="text-center">
        {{ languageStore.t('training.summaryTitle') }}
      </v-card-title>
      <v-card-text>
        <p class="mb-4 text-center">
          {{ languageStore.t('training.allExercisesDone') }}
        </p>

        <div v-for="(exercise, eIdx) in editedExercises" :key="exercise._id" class="mb-6">
          <v-card variant="outlined" class="pa-4">
            <h3 class="mb-2">{{ exercise.name }}</h3>
            <div v-if="exercise.difficulty != null" class="mb-4">
              <div class="text-subtitle-2 mb-1">
                {{ languageStore.t('training.difficulty') }}
              </div>
              <v-slider :model-value="exercise.difficulty" :min="1" :max="10" step="1" show-ticks="always" readonly
                style="pointer-events: none" :thumb-color="getDifficultyColor(exercise.difficulty)"
                :track-fill-color="getDifficultyColor(exercise.difficulty)"></v-slider>
            </div>

            <div v-for="(set, sIdx) in exercise.sets" :key="set._id" class="d-flex align-center mb-2">
              <v-text-field v-if="exercise.measurementType !== 'duration'" v-model.number="set.repetitions"
                :label="languageStore.t('trainingPlans.repetitionsShort')" type="number" density="compact"
                variant="outlined" class="me-2" />

              <v-text-field v-if="exercise.measurementType === 'weight'" v-model.number="set.weight"
                :label="languageStore.t('trainingPlans.weight')" type="number" density="compact" variant="outlined"
                class="me-2" />

              <v-text-field v-if="exercise.measurementType === 'duration'" v-model.number="set.duration"
                :label="languageStore.t('trainingPlans.duration')" type="number" density="compact" variant="outlined"
                class="me-2" />

              <v-btn size="small" @click="saveSet(eIdx, sIdx)">
                {{ languageStore.t('save') }}
              </v-btn>
            </div>

            <div v-if="planExercises[exercise.trainingPlanExercise]" class="mt-4 pa-3 bg-grey-lighten-4 rounded">
              <h4 class="mb-2">{{ languageStore.t('training.suggestedValues') }}</h4>
              <div v-if="
                exercise.measurementType !== 'duration' &&
                planExercises[exercise.trainingPlanExercise].repetitions !== undefined
              " class="field-with-button">
                <v-text-field v-model.number="planExercises[exercise.trainingPlanExercise].repetitions"
                  :label="languageStore.t('trainingPlans.repetitionsShort')" type="number" density="compact"
                  variant="outlined" style="flex: 1 1 200px;" />
                <v-btn v-if="
                  shouldShowUseLastValueButton(
                    exercise,
                    planExercises[exercise.trainingPlanExercise],
                    'repetitions'
                  )
                " size="small" @click="applyLastValue(eIdx, 'repetitions')">
                  {{
                    languageStore
                      .t('training.useLastValue')
                      .replace(
                        '{value}',
                        formatLastValueWithUnit(
                          getLastSetValue(exercise, 'repetitions'),
                          languageStore.t('trainingPlans.repetitionsShort')
                        )
                      )
                  }}
                </v-btn>
              </div>
              <div v-if="exercise.measurementType === 'weight'" class="field-with-button">
                <v-text-field v-model.number="planExercises[exercise.trainingPlanExercise].suggestedWeight"
                  :label="languageStore.t('trainingPlans.suggestedWeight')" type="number" density="compact"
                  variant="outlined" style="flex: 1 1 200px;" />
                <v-btn v-if="
                  shouldShowUseLastValueButton(
                    exercise,
                    planExercises[exercise.trainingPlanExercise],
                    'weight'
                  )
                " size="small" variant="tonal" color="primary" @click="applyLastValue(eIdx, 'weight')">
                  {{
                    languageStore
                      .t('training.useLastValue')
                      .replace(
                        '{value}',
                        formatLastValueWithUnit(
                          getLastSetValue(exercise, 'weight'),
                          'kg'
                        )
                      )
                  }}
                </v-btn>
              </div>
              <div v-if="exercise.measurementType === 'duration'" class="field-with-button">
                <v-text-field v-model.number="planExercises[exercise.trainingPlanExercise].duration"
                  :label="languageStore.t('trainingPlans.suggestedDuration')" type="number" density="compact"
                  variant="outlined" style="flex: 1 1 200px;" />
                <v-btn v-if="
                  shouldShowUseLastValueButton(
                    exercise,
                    planExercises[exercise.trainingPlanExercise],
                    'duration'
                  )
                " size="small" variant="tonal" color="primary" @click="applyLastValue(eIdx, 'duration')">
                  {{
                    languageStore
                      .t('training.useLastValue')
                      .replace(
                        '{value}',
                        formatLastValueWithUnit(
                          getLastSetValue(exercise, 'duration'),
                          languageStore.t('training.secondsShort')
                        )
                      )
                  }}
                </v-btn>
              </div>
              <v-btn size="small" class="mt-2" @click="savePlanExercise(eIdx)">
                {{ languageStore.t('save') }}
              </v-btn>
            </div>
          </v-card>
        </div>

        <div class="mb-6">
          <h3 class="mb-2">{{ languageStore.t('training.statistics') }}</h3>
          <p>
            {{ languageStore.t('training.totalMovedWeight') }}:
            {{ stats.totalWeight.toFixed(1) }} kg
          </p>
          <p>
            {{ languageStore.t('training.totalDuration') }}:
            {{ formatDuration(stats.totalDuration) }}
          </p>
          <p>
            {{ languageStore.t('training.totalSets') }}: {{ stats.totalSets }}
          </p>
          <div v-if="stats.avgWeightPerExercise.length" class="mt-4">
            <h4 class="mb-1">
              {{ languageStore.t('training.avgWeightPerExercise') }}
            </h4>
            <ul class="ms-4">
              <li v-for="item in stats.avgWeightPerExercise" :key="item.name">
                {{ item.name }}: {{ item.avgWeight.toFixed(1) }} kg
              </li>
            </ul>
          </div>
        </div>

        <div class="text-center">
          <v-btn block color="secondary" class="mt-4" @click="getFeedback" :loading="loadingFeedback">
            {{ languageStore.t('training.getFeedback') }}
          </v-btn>
          <v-btn block color="secondary" class="mt-4" @click="trackCalories" :loading="loadingCalories">
            {{ languageStore.t('training.trackCalories') }}
          </v-btn>
          <v-btn block color="primary" class="mt-4" @click="finish">
            {{ languageStore.t('training.finishTraining') }}
          </v-btn>
        </div>

        <div v-if="calories !== null" class="mt-6 text-center">
          <p>
            {{
              languageStore
                .t('training.caloriesBurned')
                .replace('{calories}', calories)
            }}
          </p>
        </div>

        <div v-if="feedback" class="mt-6">
          <h3 class="mb-2">{{ languageStore.t('training.feedbackTitle') }}</h3>
          <p>{{ feedback }}</p>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useTrainingStore } from '@/stores/trainingStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useTrackerStore } from '@/stores/trackerStore';
import { ref, watch, computed, onMounted } from 'vue';

const trainingStore = useTrainingStore();
const languageStore = useLanguageStore();
const trackerStore = useTrackerStore();
const router = useRouter();

const editedExercises = ref([]);
const planExercises = ref({});
const feedback = ref(null);
const loadingFeedback = ref(false);
const calories = ref(null);
const loadingCalories = ref(false);
onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});


const resolvePlanId = (plan) => {
  if (!plan) {
    return null;
  }
  if (typeof plan === 'string') {
    return plan;
  }
  if (typeof plan === 'object') {
    if (typeof plan._id === 'string') {
      return plan._id;
    }
    if (typeof plan.id === 'string') {
      return plan.id;
    }
    if (typeof plan.toString === 'function') {
      const value = plan.toString();
      return typeof value === 'string' ? value : null;
    }
  }
  return null;
};

const stats = computed(() => {
  let totalWeight = 0;
  let totalDuration = 0;
  let totalSets = 0;
  const weightMap = {};

  editedExercises.value.forEach((exercise) => {
    exercise.sets.forEach((set) => {
      totalSets++;
      if (
        exercise.measurementType === 'weight' &&
        set.weight != null &&
        set.repetitions != null
      ) {
        totalWeight += set.weight * set.repetitions;
        if (!weightMap[exercise.name]) {
          weightMap[exercise.name] = { weight: 0, sets: 0 };
        }
        weightMap[exercise.name].weight += set.weight;
        weightMap[exercise.name].sets += 1;
      }
      if (set.duration != null) {
        totalDuration += set.duration;
      }
    });
  });

  const avgWeightPerExercise = Object.keys(weightMap).map((name) => ({
    name,
    avgWeight: weightMap[name].weight / weightMap[name].sets,
  }));

  const logDuration = trainingStore.currentLog?.totalDuration;
  if (totalDuration <= 0 && typeof logDuration === 'number') {
    totalDuration = logDuration;
  }

  return { totalWeight, totalDuration, totalSets, avgWeightPerExercise };
});

const getDifficultyColor = (value) => {
  const ratio = (value - 1) / 9;
  const hue = (1 - ratio) * 120;
  return `hsl(${hue}, 100%, 50%)`;
};

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins} min ${secs} s`;
  }
  return `${secs} s`;
};

watch(
  () => trainingStore.currentLog,
  async (log) => {
    if (log) {
      editedExercises.value = JSON.parse(JSON.stringify(log.exercises));
      const logPlanId = resolvePlanId(log.trainingPlan);
      if (
        logPlanId &&
        (!trainingStore.selectedPlan || resolvePlanId(trainingStore.selectedPlan) !== logPlanId)
      ) {
        await trainingStore.fetchTrainingPlan(logPlanId);
      }
    }
  },
  { immediate: true }
);

watch(
  () => trainingStore.selectedPlan,
  (plan) => {
    if (plan) {
      const map = {};
      plan.days.forEach(day => {
        day.exercises.forEach(ex => {
          map[ex._id] = JSON.parse(JSON.stringify(ex));
        });
      });
      planExercises.value = map;
    }
  },
  { immediate: true }
);

const getLastSetValue = (exercise, field) => {
  if (!exercise?.sets?.length) {
    return null;
  }
  for (let i = exercise.sets.length - 1; i >= 0; i--) {
    const value = exercise.sets[i]?.[field];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return null;
};

const formatLastValueWithUnit = (value, unit = '') => {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  const trimmedUnit = unit?.trim();
  return trimmedUnit ? `${value} ${trimmedUnit}` : `${value}`;
};

const shouldShowUseLastValueButton = (exercise, planExercise, field) => {
  if (!exercise || !planExercise) {
    return false;
  }
  const sourceField = field === 'weight' ? 'weight' : field;
  const targetField = field === 'weight' ? 'suggestedWeight' : field;
  const lastValue = getLastSetValue(exercise, sourceField);
  if (lastValue === null || lastValue === undefined || lastValue === '') {
    return false;
  }
  const currentValue = planExercise[targetField];
  if (currentValue === null || currentValue === undefined || currentValue === '') {
    return true;
  }
  return Number(currentValue) !== Number(lastValue);
};

const applyLastValue = (exerciseIdx, field) => {
  const exercise = editedExercises.value[exerciseIdx];
  if (!exercise) {
    return;
  }
  const planExercise = planExercises.value[exercise.trainingPlanExercise];
  if (!planExercise) {
    return;
  }
  const sourceField = field === 'weight' ? 'weight' : field;
  const targetField = field === 'weight' ? 'suggestedWeight' : field;
  const lastValue = getLastSetValue(exercise, sourceField);
  if (lastValue === null || lastValue === undefined || lastValue === '') {
    return;
  }
  planExercise[targetField] = Number(lastValue);
};

const saveSet = async (exerciseIdx, setIdx) => {
  const originalExercise = trainingStore.currentLog.exercises[exerciseIdx];
  const originalSet = originalExercise.sets[setIdx];
  const editedSet = editedExercises.value[exerciseIdx].sets[setIdx];
  const measurementType = originalExercise.measurementType || 'none';

  const data = {};
  if (
    measurementType !== 'duration' &&
    editedSet.repetitions !== undefined &&
    editedSet.repetitions !== originalSet.repetitions
  ) {
    data.repetitions = editedSet.repetitions;
  }
  if (
    measurementType === 'weight' &&
    editedSet.weight !== undefined &&
    editedSet.weight !== originalSet.weight
  ) {
    data.weight = editedSet.weight;
  }
  if (
    measurementType === 'duration' &&
    editedSet.duration !== undefined &&
    editedSet.duration !== originalSet.duration
  ) {
    data.duration = editedSet.duration;
  }

  if (Object.keys(data).length > 0) {
    await trainingStore.updateSet(
      trainingStore.currentLog._id,
      trainingStore.currentLog.exercises[exerciseIdx]._id,
      originalSet._id,
      data
    );
    Object.assign(originalSet, editedSet);
  }
};

const savePlanExercise = async (exerciseIdx) => {
  const logExercise = trainingStore.currentLog.exercises[exerciseIdx];
  const exerciseId = logExercise.trainingPlanExercise;
  const editedPlan = planExercises.value[exerciseId];
  const originalPlan = trainingStore.selectedPlan?.days
    .flatMap(d => d.exercises)
    .find(e => e._id === exerciseId);
  const data = {};
  if (editedPlan) {
    if (
      editedPlan.repetitions !== undefined &&
      originalPlan?.repetitions !== editedPlan.repetitions
    ) {
      data.repetitions = editedPlan.repetitions;
    }
    if (
      editedPlan.suggestedWeight !== undefined &&
      originalPlan?.suggestedWeight !== editedPlan.suggestedWeight
    ) {
      data.suggestedWeight = editedPlan.suggestedWeight;
    }
    if (
      editedPlan.duration !== undefined &&
      originalPlan?.duration !== editedPlan.duration
    ) {
      data.duration = editedPlan.duration;
    }
  }
  if (Object.keys(data).length > 0) {
    await trainingStore.updatePlanExercise(
      trainingStore.selectedPlan._id,
      exerciseId,
      data
    );
    if (originalPlan) {
      Object.assign(originalPlan, data);
    }
  }
};

const finish = async () => {
  for (let e = 0; e < editedExercises.value.length; e++) {
    for (let s = 0; s < editedExercises.value[e].sets.length; s++) {
      await saveSet(e, s);
    }
  }
  await trainingStore.finishTraining(trainingStore.currentLog._id);
  router.push('/trainingPlans');
};

const getFeedback = async () => {
  loadingFeedback.value = true;
  const result = await trainingStore.fetchTrainingFeedback(
    trainingStore.currentLog._id
  );
  feedback.value = result?.analysisText || null;
  loadingFeedback.value = false;
};

const trackCalories = async () => {
  loadingCalories.value = true;
  const result = await trainingStore.trackTrainingCalories(
    trainingStore.currentLog._id
  );
  calories.value = result?.activityResult?.caloriesBurned || null;
  if (result?.tracker) {
    trackerStore.tracker = result.tracker;
  }
  loadingCalories.value = false;
};

</script>

<style scoped>
.field-with-button {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.5rem;
}

.field-with-button .v-btn {
  white-space: nowrap;
}
</style>
