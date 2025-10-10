<template>
  <!-- Help Window -->
  <RecipesHelpWindow />

  <v-expansion-panels v-model="panel">
    <v-expansion-panel>
      <v-expansion-panel-title>{{ languageStore.t('recipes.panels.selectedRecipes.title') }}</v-expansion-panel-title>
      <v-expansion-panel-text>
        <SelectedRecipeComponent />
      </v-expansion-panel-text>
    </v-expansion-panel>

    <v-expansion-panel>
      <v-expansion-panel-title>{{ languageStore.t('recipes.panels.myRecipes.title') }}</v-expansion-panel-title>
      <v-expansion-panel-text>
        <MyRecipesComponent />
      </v-expansion-panel-text>
    </v-expansion-panel>

    <v-expansion-panel>
      <v-expansion-panel-title>{{ languageStore.t('recipes.panels.favoriteRecipes.title') }}</v-expansion-panel-title>
      <v-expansion-panel-text>
        <FavoriteRecipesComponent />
      </v-expansion-panel-text>
    </v-expansion-panel>

  </v-expansion-panels>

  <!-- Info: Random tip below accordion -->
  <div>
    <v-alert type="info" density="compact" class="mt-8">
      {{ randomTipKey && languageStore.t(randomTipKey) }}
    </v-alert>
  </div>
</template>

<route lang="yaml">
  meta:
    layout: recipesLayout
</route>

<script setup>
import { ref, onMounted } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';

const languageStore = useLanguageStore();

const panel = ref([0]);

// Random tip selection
const tipKeys = [
  'recipes.tips.swipeToRemove',
  'recipes.tips.createOwn',
  'recipes.tips.printPdf',
  'recipes.tips.editOwn',
  'recipes.tips.feedbackPlanner',
];

const randomTipKey = ref('');
onMounted(() => {
  randomTipKey.value = tipKeys[Math.floor(Math.random() * tipKeys.length)];
});
</script>
