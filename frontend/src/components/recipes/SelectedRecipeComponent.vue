<template>
    <div v-if="shoppingListStore.recipes.length">
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
        <p>{{ languageStore.t('recipes.noneSelected') }}</p>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';
import draggable from 'vuedraggable';

const shoppingListStore = useShoppingListStore();
const languageStore = useLanguageStore();
const dialogStore = useDialogStore();

const localRecipes = ref([]);

onMounted(() => {
    shoppingListStore.readShoppingList();
    localRecipes.value = [...shoppingListStore.recipes];
});

// Sync local state when store changes (e.g. from server)
watch(() => shoppingListStore.recipes, (newRecipes) => {
    localRecipes.value = [...newRecipes];
}, { deep: true });

async function onDragEnd() {
    const order = localRecipes.value.map(r => r._id);
    await shoppingListStore.reorderRecipes(order);
}

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
