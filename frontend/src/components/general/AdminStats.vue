<template>
  <div>
    <v-row>
      <v-col cols="12" class="mb-2">
        {{ languageStore.t('adminStats.usersToday') }}:
        {{ stats.usersToday ?? '-' }}
        <span
          v-if="stats.usersTodayDiff !== undefined"
          :class="diffClass(stats.usersTodayDiff)"
          >({{ formatDiff(stats.usersTodayDiff) }})</span
        >
      </v-col>
      <v-col cols="12" class="mb-2">
        {{ languageStore.t('adminStats.usersWeek') }}:
        {{ stats.usersThisWeek ?? '-' }}
        <span
          v-if="stats.usersThisWeekDiff !== undefined"
          :class="diffClass(stats.usersThisWeekDiff)"
          >({{ formatDiff(stats.usersThisWeekDiff) }})</span
        >
      </v-col>
      <v-col cols="12" class="mb-2">
        {{ languageStore.t('adminStats.activeToday') }}:
        {{ stats.activeUsersToday ?? '-' }}
        <span
          v-if="stats.activeUsersTodayDiff !== undefined"
          :class="diffClass(stats.activeUsersTodayDiff)"
          >({{ formatDiff(stats.activeUsersTodayDiff) }})</span
        >
      </v-col>
      <v-col cols="12" class="mb-2">
        {{ languageStore.t('adminStats.activeWeek') }}:
        {{ stats.activeUsersThisWeek ?? '-' }}
        <span
          v-if="stats.activeUsersThisWeekDiff !== undefined"
          :class="diffClass(stats.activeUsersThisWeekDiff)"
          >({{ formatDiff(stats.activeUsersThisWeekDiff) }})</span
        >
      </v-col>
      <v-col cols="12" class="mb-2">
        {{ languageStore.t('adminStats.recipes24h') }}: {{ stats.recipesLast24h ?? '-' }}
      </v-col>
      <v-col cols="12" class="mb-2">
        {{ languageStore.t('adminStats.trainingPlans24h') }}: {{ stats.trainingPlansLast24h ?? '-' }}
      </v-col>
      <v-col cols="12" class="mb-2">
        {{ languageStore.t('adminStats.trainingLogsWeek') }}:
        {{ stats.trainingLogsThisWeek ?? '-' }}
        <span
          v-if="stats.trainingLogsThisWeekDiff !== undefined"
          :class="diffClass(stats.trainingLogsThisWeekDiff)"
          >({{ formatDiff(stats.trainingLogsThisWeekDiff) }})</span
        >
      </v-col>
      <v-col cols="12" class="mb-2">
        {{ languageStore.t('adminStats.plannerUsersTotal') }}: {{ stats.plannerUsersTotal ?? '-' }}
      </v-col>
      <v-col cols="12" class="mb-2">
        {{ languageStore.t('adminStats.plannerToday') }}:
        {{ stats.plannerUsersToday ?? '-' }}
        <span
          v-if="stats.plannerUsersTodayDiff !== undefined"
          :class="diffClass(stats.plannerUsersTodayDiff)"
          >({{ formatDiff(stats.plannerUsersTodayDiff) }})</span
        >
      </v-col>
      <v-col cols="12" class="mb-2">
        {{ languageStore.t('adminStats.plannerWeek') }}:
        {{ stats.plannerUsersThisWeek ?? '-' }}
        <span
          v-if="stats.plannerUsersThisWeekDiff !== undefined"
          :class="diffClass(stats.plannerUsersThisWeekDiff)"
          >({{ formatDiff(stats.plannerUsersThisWeekDiff) }})</span
        >
      </v-col>
      <v-col cols="12" class="mb-2">
        {{ languageStore.t('adminStats.shoppingUpdatedToday') }}:
        {{ stats.shoppingListUsersToday ?? '-' }}
        <span
          v-if="stats.shoppingListUsersTodayDiff !== undefined"
          :class="diffClass(stats.shoppingListUsersTodayDiff)"
          >({{ formatDiff(stats.shoppingListUsersTodayDiff) }})</span
        >
      </v-col>
      <v-col cols="12" class="mb-2">
        {{ languageStore.t('adminStats.shoppingUpdatedWeek') }}:
        {{ stats.shoppingListUsersThisWeek ?? '-' }}
        <span
          v-if="stats.shoppingListUsersThisWeekDiff !== undefined"
          :class="diffClass(stats.shoppingListUsersThisWeekDiff)"
          >({{ formatDiff(stats.shoppingListUsersThisWeekDiff) }})</span
        >
      </v-col>
      <v-col cols="12" class="mb-2">
        {{ languageStore.t('adminStats.calorieTrackerTotal') }}:
        {{ stats.calorieTrackerUsersTotal ?? '-' }}
      </v-col>
      <v-col cols="12" class="mb-2">
        {{ languageStore.t('adminStats.calorieTrackerToday') }}:
        {{ stats.calorieTrackerUsersToday ?? '-' }}
        <span
          v-if="stats.calorieTrackerUsersTodayDiff !== undefined"
          :class="diffClass(stats.calorieTrackerUsersTodayDiff)"
          >({{ formatDiff(stats.calorieTrackerUsersTodayDiff) }})</span
        >
      </v-col>
      <v-col cols="12" class="mb-2">
        {{ languageStore.t('adminStats.calorieTrackerWeek') }}:
        {{ stats.calorieTrackerUsersThisWeek ?? '-' }}
        <span
          v-if="stats.calorieTrackerUsersThisWeekDiff !== undefined"
          :class="diffClass(stats.calorieTrackerUsersThisWeekDiff)"
          >({{ formatDiff(stats.calorieTrackerUsersThisWeekDiff) }})</span
        >
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApiStore } from '@/stores/apiStore';
import { useLanguageStore } from '@/stores/languageStore';

const apiStore = useApiStore();
const languageStore = useLanguageStore();

const stats = ref({});

const formatDiff = (val) => {
  if (val > 0) return `+${val}`;
  return String(val);
};

const diffClass = (val) => {
  if (val > 0) return 'text-success';
  if (val < 0) return 'text-error';
  return '';
};

onMounted(async () => {
  const response = await apiStore.apiRequest('get', '/system/stats');
  if (response && response.status === 200) {
    stats.value = response.data;
  }
});
</script>
