<template>
  <v-app extended>
    <!-- App Bar -->
    <v-app-bar color="primary" prominent app class="pt-5 mb-3">
      <v-toolbar-title>{{ languageStore.t('recipes.title') }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-arrow-left" @click="goBack"></v-btn>
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

  <AddRecipeDialog v-model="dialogStore.dialogs.addRecipeDialog" />
  <EditRecipeDialog v-model="dialogStore.dialogs.editRecipeDialog" />
  <RecipeFeedbackDialog v-model="dialogStore.dialogs.recipeFeedbackDialog" />
  <TrackRecipeDialog v-if="dialogStore.dialogs.trackRecipeDialog" v-model="dialogStore.dialogs.trackRecipeDialog" />
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';
import { useRecipeStore } from '@/stores/recipeStore';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { useUserStore } from '@/stores/userStore';
import { useBottomMenuStore } from '@/stores/bottomMenuStore';

const languageStore = useLanguageStore();
const dialogStore = useDialogStore();
const recipeStore = useRecipeStore();
const shoppingList = useShoppingListStore();
const userStore = useUserStore();
const bottomMenuStore = useBottomMenuStore();

onMounted(() => {
  recipeStore.loadCache();
  userStore.fetchRole();
});
const router = useRouter();

// No drawer state

const menuItems = computed(() => {
  const baseItems = [
    { title: languageStore.t('recipe.menu.addToList'), action: () => showAddRecipeDialog() }
  ];

  switch (recipeStore.currentRecipeType) {
    case 0:
      baseItems.push({ title: languageStore.t('recipe.menu.addFavorite'), action: () => addFavorite() });
      baseItems.push({ title: languageStore.t('recipe.menu.removeRecipe'), action: () => removeRecipe() });
      if (userStore.isAdmin) {
        baseItems.push({ title: languageStore.t('recipe.menu.editRecipe'), action: () => editRecipe() });
      }
      break;
    case 1:
      baseItems.push({ title: languageStore.t('recipe.menu.removeFavorite'), action: () => removeFavorite() });
      if (userStore.isAdmin) {
        baseItems.push({ title: languageStore.t('recipe.menu.editRecipe'), action: () => editRecipe() });
      }
      break;
    case 2:
      baseItems.push({ title: languageStore.t('recipe.menu.editRecipe'), action: () => editRecipe() });
      baseItems.push({ title: languageStore.t('recipe.menu.deleteRecipe'), action: () => deleteUserRecipe() });
      break;
  }

  baseItems.push({ title: languageStore.t('recipe.menu.trackRecipe'), action: () => trackRecipe() });
  baseItems.push({ title: languageStore.t('recipe.menu.downloadPdf'), action: () => downloadPdf() });
  baseItems.push({ title: languageStore.t('recipe.menu.feedback'), action: () => showFeedbackDialog() });

  return baseItems;
});

// Expose actions to the global bottom-sheet menu
watch(menuItems, (items) => bottomMenuStore.setItems(items, 'recipe'), { immediate: true });
onUnmounted(() => bottomMenuStore.clearItems('recipe'));

const showAddRecipeDialog = () => {
  dialogStore.openDialog('addRecipeDialog');
};

const showFeedbackDialog = () => {
  dialogStore.openDialog('recipeFeedbackDialog');
};

const trackRecipe = () => {
  dialogStore.openDialog("trackRecipeDialog");
};

const downloadPdf = () => {
  if (recipeStore.currentRecipe) {
    recipeStore.downloadRecipePdf(
      recipeStore.currentRecipe._id,
      recipeStore.currentRecipe.servings
    );
  }
};

const addFavorite = () => {
  recipeStore.addFavoriteRecipe(recipeStore.currentRecipe._id);
  return;
};

const removeFavorite = () => {
  recipeStore.removeFavoriteRecipe(recipeStore.currentRecipe._id);
  return;
};

const removeRecipe = () => {
  shoppingList.removeRecipe(recipeStore.currentRecipe._id);
  router.push('/recipes');
  return;
};

const deleteUserRecipe = () => {
  recipeStore.deleteUserRecipe(recipeStore.currentRecipe._id);
  return;
};

const editRecipe = () => {
  dialogStore.openDialog('editRecipeDialog');
};

// No navigation drawer

const goBack = () => {
  router.back();
};
</script>

