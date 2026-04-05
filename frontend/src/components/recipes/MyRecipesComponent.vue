<template>
    <div v-if="recipeStore.userRecipes.length">
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
        <p>{{ languageStore.t('recipes.empty') }}</p>
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
    await recipeStore.fetchUserRecipes();
    localRecipes.value = [...recipeStore.userRecipes];
});

// Sync local state when store changes
watch(() => recipeStore.userRecipes, (newRecipes) => {
    localRecipes.value = [...newRecipes];
}, { deep: true });

async function onDragEnd() {
    // Update store state immediately for responsive feel
    recipeStore.userRecipes = [...localRecipes.value];
    const order = localRecipes.value.map(r => r._id);
    await recipeStore.reorderUserRecipes(order);
}

function handleRecipeSwipe(recipeId) {
    dialogStore.openConfirmDialog(
        languageStore.t('general.deleteRecipeDialog.text'),
        languageStore.t('general.deleteRecipeDialog.dialogMsg'),
        () => {
            recipeStore.deleteUserRecipe(recipeId);
        }
    );
}
</script>
