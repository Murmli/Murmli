<template>
  <v-app extended>
    <!-- App Bar -->
    <v-app-bar color="primary" prominent app class="pt-5 mb-3" extension-height="38">
      <v-toolbar-title>{{ languageStore.t('navigation.calorieCounter') }}</v-toolbar-title>

      <!-- Actions moved to BottomNavigation bottom sheet via bottomMenuStore -->

      <!-- Erweiterungs-Slot für zusätzliche Inhalte -->
      <template v-slot:extension>
        <TrackItemComponent />
      </template>
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

  <!-- BodyDataDialog -->
  <BodyDataDialog v-if="dialogStore.dialogs.bodyDataDialog" v-model="dialogStore.dialogs.bodyDataDialog" />

  <!-- CalorieGoalDialog -->
  <CalorieGoalDialog v-if="dialogStore.dialogs.calorieGoalDialog" v-model="dialogStore.dialogs.calorieGoalDialog" />

  <!-- CalorieCalculatorDialog -->
  <CalorieCalculatorDialog v-if="dialogStore.dialogs.calorieCalculatorDialog"
    v-model="dialogStore.dialogs.calorieCalculatorDialog" />

  <!-- TrackActivity Dialog -->
  <TrackActivityDialog v-if="dialogStore.dialogs.trackActivityDialog"
    v-model="dialogStore.dialogs.trackActivityDialog" />

  <!-- TrackRecipe Dialog -->
  <TrackRecipeDialog v-if="dialogStore.dialogs.trackRecipeDialog" v-model="dialogStore.dialogs.trackRecipeDialog" />

  <!-- ListSort Dialog -->
  <ListSortComponent v-if="dialogStore.dialogs.listSortDialog" v-model="dialogStore.dialogs.listSortDialog" />

  <!-- Indicator Settings Dialog -->
  <IndicatorSettingsDialog v-if="dialogStore.dialogs.indicatorSettingsDialog" />
</template>

<script setup>
import { computed, watch, onUnmounted } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { useBottomMenuStore } from '@/stores/bottomMenuStore';

const languageStore = useLanguageStore();
const dialogStore = useDialogStore();
const shoppingListStore = useShoppingListStore();
const bottomMenuStore = useBottomMenuStore();

// Menu items as a computed property
const menuItems = computed(() => [
  { title: languageStore.t('tracker.bodyData'), action: () => bodyDataDialog() },
  { title: languageStore.t('tracker.calorieGoal'), action: () => calorieGoal() },
  { title: languageStore.t('tracker.trackActivity'), action: () => trackActivity() },
  { title: languageStore.t('tracker.trackRecipe'), action: () => trackRecipe() },
  { title: languageStore.t('tracker.indicatorSettings.menuTitle'), action: () => indicatorSettings() },
]);

// Expose actions to the global bottom-sheet menu
watch(menuItems, (items) => bottomMenuStore.setItems(items, 'tracker'), { immediate: true });
onUnmounted(() => bottomMenuStore.clearItems('tracker'));


// No drawer

// Dummy functions
const bodyDataDialog = () => {
  dialogStore.openDialog("bodyDataDialog");
};

const trackActivity = () => {
  dialogStore.openDialog("trackActivityDialog");
};

const trackRecipe = () => {
  dialogStore.openDialog("trackRecipeDialog");
};

const calorieGoal = () => {
  dialogStore.openDialog("calorieGoalDialog");
};

const indicatorSettings = () => {
  dialogStore.openDialog("indicatorSettingsDialog");
};

const askQuestion = () => {
  dialogStore.openDialog("askDialog");
};

// No navigation drawer
</script>

<style scoped>
.rotate-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
