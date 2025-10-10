<template>
  <div v-if="recipeStore.currentRecipe">

    <!-- Image & Title -->
    <h4 class="text-center">{{ recipeStore.currentRecipe.title }}</h4>
    <v-card class="mx-auto ma-4" width="100%" max-width="400" height="110" :image="recipeStore.currentRecipe.image"
      theme="dark">
    </v-card>



    <!-- Servings -->
    <div>
      <h4 class="ma-5 text-center">
        {{ languageStore.t('recipe.recipeFor') }}
        {{ recipeStore.currentRecipe.servings }}
        {{ personText }}
      </h4>
    </div>


    <!-- Prepartion -->
    <v-expansion-panels multiple variant="popout">
      <v-expansion-panel value="999">
        <v-expansion-panel-title>{{ languageStore.t('recipe.prepareIngredients') }}</v-expansion-panel-title>
        <v-expansion-panel-text>
          <ul class="pa-3 ml-5">
            <li v-for="(ingredient, y) in recipeStore.currentRecipe.ingredients" :key="y">
              <span class="text-capitalize">{{ ingredient.name }}</span>
              <template v-if="ingredient && ingredient.unit.id != 11">
                ({{ ingredient.quantity }} {{ ingredient.unit.name }})
              </template>
            </li>
          </ul>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Steps -->
      <v-expansion-panel v-for="(step, i) in recipeStore.currentRecipe.steps" :key="i" :value="i">
        <v-expansion-panel-title>{{ i + 1 }}. {{ step.name }}</v-expansion-panel-title>
        <v-expansion-panel-text>
          <ul class="pa-3 ml-5">
            <li v-for="(item, y) in step.head" :key="y">
              {{ item.name }}
              <template v-if="item && item.unit.id != 11">
                ({{ item.quantity }} {{ item.unit.name }})
              </template>
            </li>
          </ul>
          <p>{{ step.content }}</p>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Nurtients -->
    <div>
      <h3 class="ma-5 text-center">{{ languageStore.t('recipe.nutrition.title') }}</h3>
      <v-row class="ma-5 text-center">
        <v-col class="text-center">
          <p>{{ languageStore.t('recipe.nutrition.kilocalories') }}</p>
          <p>{{ recipeStore.currentRecipe.nutrients.kilocalories }}</p>
        </v-col>
        <v-col class="text-center">
          <p>{{ languageStore.t('recipe.nutrition.carbohydrates') }}</p>
          <p>{{ recipeStore.currentRecipe.nutrients.carbohydrates }}</p>
        </v-col>
        <v-col class="text-center">
          <p>{{ languageStore.t('recipe.nutrition.fat') }}</p>
          <p>{{ recipeStore.currentRecipe.nutrients.fat }}</p>
        </v-col>
        <v-col class="text-center">
          <p>{{ languageStore.t('recipe.nutrition.protein') }}</p>
          <p>{{ recipeStore.currentRecipe.nutrients.protein }}</p>
        </v-col>
      </v-row>
    </div>

    <!-- Informationen -->
    <div>
      <h3 class="my-5 text-center">{{ languageStore.t('recipe.information.title') }}</h3>
      <v-row class="" width="100%">
        <v-col class="text-center" cols="6" width="100%">
          <p>{{ languageStore.t('recipe.information.preparationTime') }}</p>
          <v-icon icon="mdi-clock-time-four-outline"></v-icon>
          <p>{{ recipeStore.currentRecipe.preparationTime }} min</p>
        </v-col>
        <v-col class="text-center" cols="6" width="100%">
          <p>{{ languageStore.t('recipe.information.everyday') }}</p>
          <v-icon icon="mdi-calendar-check"></v-icon>
          <p>{{ recipeStore.currentRecipe.everydayRating }} / 10</p>
        </v-col>
      </v-row>

      <v-row class="">
        <v-col class="text-center">
          <p>{{ languageStore.t('recipe.information.healthy') }}</p>
          <v-icon icon="mdi-drama-masks"></v-icon>
          <p>{{ recipeStore.currentRecipe.healthRating }} / 10</p>
        </v-col>
        <v-col class="text-center">
          <p>{{ languageStore.t('recipe.information.price') }}</p>
          <v-icon icon="mdi-currency-usd"></v-icon>
          <p>{{ recipeStore.currentRecipe.priceRating }} / 10</p>
        </v-col>
      </v-row>

      <v-row class="">
        <v-col class="text-center">
          <p>{{ languageStore.t('recipe.information.difficulty') }}</p>
          <v-icon icon="mdi-chart-areaspline"></v-icon>
          <p>{{ recipeStore.currentRecipe.difficultyRating }} / 10</p>
        </v-col>
        <v-col class="text-center">
          <p>{{ languageStore.t('recipe.information.sustainability') }}</p>
          <v-icon icon="mdi-repeat"></v-icon>
          <p>{{ recipeStore.currentRecipe.sustainabilityRating }} / 10</p>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<route lang="yaml">
  meta:
    layout: recipeLayout
</route>

<script setup>
import { useLanguageStore } from '@/stores/languageStore'
import { useRecipeStore } from '@/stores/recipeStore'
import { useRouter } from 'vue-router'
import { onMounted, onUnmounted, computed } from 'vue'
import { KeepAwake } from '@capacitor-community/keep-awake'

const languageStore = useLanguageStore()
const recipeStore = useRecipeStore()
const router = useRouter()

const personText = computed(() => {
  return recipeStore.currentRecipe.servings === 1
    ? languageStore.t('recipe.recipePerson')
    : languageStore.t('recipe.recipePersons');
});


onMounted(() => {
  KeepAwake.keepAwake()
  if (!recipeStore.currentRecipe) {
    router.push('/recipes')
  }
})

onUnmounted(() => {
  KeepAwake.allowSleep()
})
</script>
