<template>
    <v-card class="mx-auto ma-2 card-overlay d-flex align-center justify-center" width="100%" max-width="400"
        height="80" :image="recipe.image" theme="dark" @click="goToRecipe(recipe)"
        v-touch="{ left: wrapper => swiped(wrapper, recipe._id), right: wrapper => swiped(wrapper, recipe._id) }">
        <div class="overlay"></div>
        <div class="title-container">
            <v-card-title class="text-subtitle-2 text-center">{{ recipe.title }}</v-card-title>
        </div>
    </v-card>
</template>

<script setup>
defineProps({
    recipe: {
        type: Object,
        required: true
    }
});

import { useRouter } from 'vue-router';
import { useRecipeStore } from '@/stores/recipeStore';

const recipeStore = useRecipeStore();
const router = useRouter();
const emit = defineEmits(['swiped']);

async function goToRecipe(recipe) {
    if (recipe.isFavorite) {
        recipeStore.setCurrentRecipe(recipe, 1); // set current is for favorite and userRecipes, needed for layout
    } else if (recipe.userId) {
        recipeStore.setCurrentRecipe(recipe, 2); // set current is for favorite and userRecipes, needed for layout
    }
    else {
        await recipeStore.fetchRecipe(recipe, recipe.servings); // linked with shoppinglist, servigns must be incldues
    }
    const path = `/recipe`;
    router.push(path);
}

function swiped(wrapper, id) {
    const threshold = 50;
    if (Math.abs(wrapper.offsetX) > threshold) {
        emit('swiped', id);
    }
}
</script>

<style scoped>
.card-overlay {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1;
}

.title-container {
    max-width: 90%;
    z-index: 2;
    white-space: normal;
    word-wrap: break-word;
    overflow-wrap: break-word;
    line-height: 1.2;
}

.v-card-title {
    white-space: normal;
}
</style>
