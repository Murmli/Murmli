<template>
  <v-app extended>
    <!-- App Bar -->
    <v-app-bar color="primary" prominent app class="pt-5 mb-3">
      <v-toolbar-title>{{ languageStore.t('recipes.title') }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-plus" @click="createRecipe" :disabled="isGenerating"></v-btn>
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

  <!-- Planner Filter Dialog -->
  <UserRecipeComponent v-model="dialogStore.dialogs.userRecipeDialog" />
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';
import { useRecipeStore } from '@/stores/recipeStore';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { useBottomMenuStore } from '@/stores/bottomMenuStore';
import UserRecipeComponent from '@/components/recipes/dialogs/UserRecipeComponent.vue';

const languageStore = useLanguageStore();
const dialogStore = useDialogStore();
const recipeStore = useRecipeStore();
const shoppingListStore = useShoppingListStore();
const bottomMenuStore = useBottomMenuStore();

const isGenerating = computed(() => recipeStore.generationStatus === 'processing');

// No drawer state

// Menu items as a computed property
const menuItems = computed(() => [
  { title: languageStore.t('shoppingList.removeRecipes.text'), action: () => removeRecipes() },
  { title: languageStore.t('recipes.downloadSelectedPdf'), action: () => downloadSelectedRecipes() },
]);

// Expose actions to the global bottom-sheet menu
watch(menuItems, (items) => bottomMenuStore.setItems(items, 'recipes'), { immediate: true });
onUnmounted(() => bottomMenuStore.clearItems('recipes'));

onMounted(() => {
  recipeStore.loadCache();
});

const removeRecipes = () => {
  dialogStore.openConfirmDialog(
    languageStore.t('shoppingList.removeRecipes.text'),
    languageStore.t('shoppingList.removeRecipes.dialogMsg'),
    () => {
      shoppingListStore.deleteAllRecipes();
    }
  );
};

const downloadSelectedRecipes = () => {
  if (shoppingListStore.recipes.length) {
    recipeStore.downloadSelectedRecipesPdf(shoppingListStore.recipes);
  }
};

const createRecipe = () => {
  if (isGenerating.value) {
    alert(languageStore.t('recipes.processingMessage'));
    return;
  }
  dialogStore.openDialog('userRecipeDialog');
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
