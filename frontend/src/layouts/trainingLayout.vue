<template>
  <v-app extended>
    <!-- App Bar -->
    <v-app-bar color="primary" prominent app class="pt-5 mb-3">
      <v-toolbar-title>{{ languageStore.t('trainingPlans.title') }}</v-toolbar-title>
      <!-- Actions moved to BottomNavigation bottom sheet via bottomMenuStore -->
    </v-app-bar>

    <!-- No side drawer -->

    <LoadingOverlay />

    <!-- Content -->
    <v-main class="fill-height d-flex flex-column">
      <v-container fluid class="fill-height d-flex flex-column mt-3">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { computed, watch, onUnmounted } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useTrainingStore } from '@/stores/trainingStore';
import router from '@/router';
import { useBottomMenuStore } from '@/stores/bottomMenuStore';

const languageStore = useLanguageStore();
const trainingStore = useTrainingStore();
const bottomMenuStore = useBottomMenuStore();

// No drawer state

// Menu items as a computed property
const menuItems = computed(() => {
  const items = [];
  if (trainingStore.currentLog?.status === 'in-progress') {
    items.push({ title: languageStore.t('training.cancelTraining'), action: () => cancelTraining() });
  }
  return items;
});

// Expose actions to the global bottom-sheet menu
watch(menuItems, (items) => bottomMenuStore.setItems(items, 'training'), { immediate: true });
onUnmounted(() => bottomMenuStore.clearItems('training'));

const cancelTraining = async () => {
  if (confirm(languageStore.t('training.cancelTrainingConfirm'))) {
    await trainingStore.cancelTraining();
    router.push('/trainingPlans');
  }
};

// No navigation drawer
</script>

