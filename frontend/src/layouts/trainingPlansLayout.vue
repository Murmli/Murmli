<template>
  <v-app extended>
    <!-- App Bar -->
    <v-app-bar color="primary" prominent app class="pt-5 mb-3">
      <v-toolbar-title>{{
        languageStore.t("trainingPlans.title")
      }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        icon="mdi-plus"
        @click="createPlan"
        :disabled="isGenerating"
      ></v-btn>
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

  <!-- Dialogs -->
  <CreatePlanComponent v-model="dialogStore.dialogs.createTrainingPlanDialog" />
</template>

<script setup>
import { computed, watch, onUnmounted } from "vue";
import { useLanguageStore } from "@/stores/languageStore";
import { useDialogStore } from "@/stores/dialogStore";
import { useTrainingStore } from "@/stores/trainingStore";
import { useBottomMenuStore } from "@/stores/bottomMenuStore";

const languageStore = useLanguageStore();
const dialogStore = useDialogStore();
const trainingStore = useTrainingStore();
const bottomMenuStore = useBottomMenuStore();

const isGenerating = computed(
  () => trainingStore.generationStatus === "processing",
);

// No drawer

// Menu items as a computed property
const menuItems = computed(() => []);

// Expose actions to the global bottom-sheet menu
watch(menuItems, (items) => bottomMenuStore.setItems(items, 'trainingPlans'), { immediate: true });
onUnmounted(() => bottomMenuStore.clearItems('trainingPlans'));

const createPlan = () => {
  if (isGenerating.value) {
    alert(languageStore.t("trainingPlans.processingMessage"));
    return;
  }
  dialogStore.openDialog("createTrainingPlanDialog");
};

// No navigation drawer
</script>

