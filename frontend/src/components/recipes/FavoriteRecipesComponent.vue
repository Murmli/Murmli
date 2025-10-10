<template>
    <div v-if="recipeStore.favoriteRecipes.length">
        <RecipeCardComponent v-for="recipe in recipeStore.favoriteRecipes" :key="recipe._id" :recipe="recipe"
            @swiped="handleRecipeSwipe" />
    </div>
    <div v-else>
        <p>{{ languageStore.t('recipes.noFavorites') }}</p>
    </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRecipeStore } from '@/stores/recipeStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';

const recipeStore = useRecipeStore();
const languageStore = useLanguageStore();
const dialogStore = useDialogStore();

function handleRecipeSwipe(recipeId) {
    dialogStore.openConfirmDialog(
        languageStore.t('general.deleteRecipeDialog.text'),
        languageStore.t('general.deleteRecipeDialog.dialogMsg'),
        () => {
            recipeStore.removeFavoriteRecipe(recipeId);
        }
    );
}

onMounted(async () => {
    recipeStore.loadCache();
    recipeStore.fetchFavoriteRecipes();
});
</script>
