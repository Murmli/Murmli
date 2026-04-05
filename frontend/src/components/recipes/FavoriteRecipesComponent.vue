<template>
    <div v-if="recipeStore.favoriteRecipes.length">
        <draggable 
            v-model="localRecipes" 
            item-key="_id"
            :delay="300"
            :delay-on-touch-only="true"
            @end="onDragEnd"
        >
            <template #item="{ element: recipe }">
                <RecipeCardComponent :recipe="recipe" @swiped="handleRecipeSwipe" />
            </template>
        </draggable>
    </div>
    <div v-else>
        <p>{{ languageStore.t('recipes.noFavorites') }}</p>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRecipeStore } from '@/stores/recipeStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';
import draggable from 'vuedraggable';

const recipeStore = useRecipeStore();
const languageStore = useLanguageStore();
const dialogStore = useDialogStore();

const localRecipes = ref([]);

onMounted(async () => {
    recipeStore.loadCache();
    await recipeStore.fetchFavoriteRecipes();
    localRecipes.value = [...recipeStore.favoriteRecipes];
});

// Sync local state when store changes
watch(() => recipeStore.favoriteRecipes, (newRecipes) => {
    localRecipes.value = [...newRecipes];
}, { deep: true });

async function onDragEnd() {
    // Update store state immediately for responsive feel
    recipeStore.favoriteRecipes = [...localRecipes.value];
    const order = localRecipes.value.map(r => r._id);
    await recipeStore.reorderFavoriteRecipes(order);
}

function handleRecipeSwipe(recipeId) {
    dialogStore.openConfirmDialog(
        languageStore.t('general.deleteRecipeDialog.text'),
        languageStore.t('general.deleteRecipeDialog.dialogMsg'),
        () => {
            recipeStore.removeFavoriteRecipe(recipeId);
        }
    );
}
</script>
