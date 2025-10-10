<template>
  <!-- Help Window -->
  <TrackerHelpWindow />

  <v-container>
    <TimePickerComponent class="mb-1" />
    <MacronutrientsComponent class="mb-5" />
    <DietlevelComponent class="my-5" />
    <TrackProgressComponent class="mb-5" />
    <ActivityItemsComponent class="mb-5" />
    <TrackerItemsComponent />
    <FavoriteTrackerItemsComponent v-if="favorites.length > 0" />
  </v-container>
</template>

<route lang="yaml">
  meta:
    layout: trackerLayout
</route>

<script setup>
import { onMounted, computed } from 'vue';
import { useTrackerStore } from '@/stores/trackerStore';

const trackerStore = useTrackerStore();
const favorites = computed(() => trackerStore.getFavorites());

// Lifecycle Hooks
onMounted(async () => {
  trackerStore.fetchTracker();
  trackerStore.fetchBodyData();
});
</script>