<template>
  <v-app extended>
    <!-- App Bar -->
    <v-app-bar color="primary" prominent app class="pt-5 mb-3">
      <v-toolbar-title>{{ languageStore.t('planner.title') }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <!-- Help moved to BottomNavigation bottom sheet -->
      <v-btn icon="mdi-filter" @click="showFilterDialog"></v-btn>

    </v-app-bar>

    <!-- No side drawer -->

    <!-- Content -->
    <v-main class="fill-height d-flex flex-column">
      <v-container fluid class="fill-height d-flex flex-column mt-3">
        <router-view />
      </v-container>
    </v-main>
  </v-app>

  <!-- Planner Filter Dialog -->
  <PlannerFilterComponent v-model="dialogStore.dialogs.plannerFilterDialog" />

  <LoadingOverlay />
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';
import { useBottomMenuStore } from '@/stores/bottomMenuStore';

const languageStore = useLanguageStore();
const dialogStore = useDialogStore();
const bottomMenuStore = useBottomMenuStore();

// No drawer

const showFilterDialog = () => {
  dialogStore.openDialog('plannerFilterDialog');
};

// Help action for bottom sheet (no filter here)
const showHelp = () => {
  dialogStore.openDialog('plannerHelpWindow');
};

// Provide only the Help item to the global bottom menu
const menuItems = computed(() => [
  { title: languageStore.t('general.help'), action: () => showHelp() },
]);

watch(menuItems, (items) => bottomMenuStore.setItems(items, 'planner'), { immediate: true });
onUnmounted(() => bottomMenuStore.clearItems('planner'));

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
