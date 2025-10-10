<template>
    <v-dialog v-model="dialogStore.dialogs.trackRecipeDialog">
        <v-card>
            <v-card-title>{{ languageStore.t('tracker.trackRecipe') }}</v-card-title>
            <v-card-text>
                <v-select v-model="selectedRecipe" :items="availableRecipes" item-title="title" item-value="_id"
                    :label="languageStore.t('tracker.selectRecipe')" return-object :loading="loading"
                    class="mb-3"></v-select>

                <v-text-field v-model="portions" type="number" min="0.25" step="0.25"
                    :label="languageStore.t('tracker.portions')" class="mb-3"></v-text-field>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="closeSheet">{{ languageStore.t('general.cancel') }}</v-btn>
                <v-btn color="primary" @click="trackRecipe" :disabled="!selectedRecipe || !portions || portions <= 0">
                    {{ languageStore.t('general.confirm') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useTrackerStore } from '@/stores/trackerStore';
import { useRecipeStore } from '@/stores/recipeStore';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { useDialogStore } from '@/stores/dialogStore';
import { useRouter } from 'vue-router';

const router = useRouter();
const dialogStore = useDialogStore();
const languageStore = useLanguageStore();
const trackerStore = useTrackerStore();
const recipeStore = useRecipeStore();
const shoppingListStore = useShoppingListStore();

const selectedRecipe = ref(null);
const portions = ref(1);
const availableRecipes = ref([]);
const loading = ref(false);

// Load recipes when component is mounted
onMounted(async () => {
    recipeStore.loadCache();
    loading.value = true;

    // First try to load user recipes
    await recipeStore.fetchUserRecipes();

    // Then load favorite recipes
    await recipeStore.fetchFavoriteRecipes();

    // Make sure shopping list is loaded
    if (!shoppingListStore.recipes.length) {
        await shoppingListStore.readShoppingList();
    }

    // Combine all recipe sources
    // Use a Map to avoid duplicates (in case a recipe appears in multiple sources)
    const recipeMap = new Map();

    // Add user recipes
    recipeStore.userRecipes.forEach(recipe => {
        recipeMap.set(recipe._id, recipe);
    });

    // Add favorite recipes
    recipeStore.favoriteRecipes.forEach(recipe => {
        recipeMap.set(recipe._id, recipe);
    });

    // Add shopping list recipes
    shoppingListStore.recipes.forEach(recipe => {
        recipeMap.set(recipe._id, recipe);
    });

    // Convert map back to array
    availableRecipes.value = Array.from(recipeMap.values());

    // Wenn ein currentRecipe existiert, wähle es voraus
    if (recipeStore.currentRecipe && recipeStore.currentRecipe._id) {
        const found = availableRecipes.value.find(r => r._id === recipeStore.currentRecipe._id);
        if (found) {
            selectedRecipe.value = found;
        }
    }

    loading.value = false;
});

const trackRecipe = async () => {
    if (selectedRecipe.value && portions.value > 0) {
        // Prüfe, ob ein aktueller Tracker vorhanden ist, sonst lade ihn
        if (!trackerStore.tracker || !trackerStore.tracker._id) {
            await trackerStore.fetchTracker();
        }
        // Jetzt kann getrackt werden
        await trackerStore.trackRecipe(selectedRecipe.value._id, portions.value);
        closeSheet();
        router.push('/tracker');
    }
};

const closeSheet = () => {
    dialogStore.closeDialog('trackRecipeDialog');
    // Reset form values
    selectedRecipe.value = null;
    portions.value = 1;
};
</script>