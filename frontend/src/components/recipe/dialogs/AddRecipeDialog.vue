<template>
    <v-dialog v-model="dialogStore.dialogs.addRecipeDialog" location="top" scrollable>
        <v-card max-width="500" style="margin-top: 20px;">
            <v-card-title>{{ languageStore.t('recipes.addIngredients') }}</v-card-title>
            <v-card-text>
                <div>
                    <p class="py-5 text-center">{{ languageStore.t('recipes.addIngreditensInfo') }}</p>
                </div>
                <v-select v-model="portions" :items="portionOptions" :label="languageStore.t('recipes.selectPortions')"
                    outlined dense class="mt-5"></v-select>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="addRecipe">{{ languageStore.t('general.confirm') }}</v-btn>
                <v-btn @click="closeSheet">{{ languageStore.t('general.cancel') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useRecipeStore } from '@/stores/recipeStore';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { useDialogStore } from '@/stores/dialogStore';
import { usePlannerStore } from '@/stores/plannerStore';
import { useRouter } from 'vue-router';

const router = useRouter();
const dialogStore = useDialogStore();
const languageStore = useLanguageStore();
const recipeStore = useRecipeStore();
const shoppinglistStore = useShoppingListStore();
const plannerStore = usePlannerStore();
const portions = ref(4);
const portionOptions = Array.from({ length: 12 }, (_, i) => i + 1);

watch(() => dialogStore.dialogs.addRecipeDialog, async (newVal) => {
    if (newVal) {
        await plannerStore.fetchFilters();
        portions.value = plannerStore.filters.servings || 2;
    }
});

const addRecipe = () => {
    shoppinglistStore.addRecipe(recipeStore.currentRecipe._id, portions.value)
    closeSheet();
    router.push('/');
};

const closeSheet = () => {
    dialogStore.closeDialog('addRecipeDialog');
};
</script>
