<template>
    <div v-if="shoppingListStore.recipes.length">
        <RecipeCardComponent v-for="recipe in shoppingListStore.recipes" :key="recipe._id" :recipe="recipe"
            @swiped="handleRecipeSwipe" />
    </div>
    <div v-else>
        <p>{{ languageStore.t('recipes.noneSelected') }}</p>
    </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';

const shoppingListStore = useShoppingListStore();
const languageStore = useLanguageStore();
const dialogStore = useDialogStore();


onMounted(() => {
    shoppingListStore.readShoppingList();
});

function handleRecipeSwipe(recipeId) {
    dialogStore.openConfirmDialog(
        languageStore.t('general.deleteRecipeDialog.text'),
        languageStore.t('general.deleteRecipeDialog.dialogMsg'),
        () => {
            shoppingListStore.removeRecipe(recipeId);
        }
    );
}
</script>
