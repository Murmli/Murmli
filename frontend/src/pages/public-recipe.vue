<template>
    <div v-if="recipe" class="public-recipe-page">
        <!-- Download Banner -->
        <div class="download-banner">
            <v-card class="pa-4 text-center" color="primary" dark>
                <h3>{{ languageStore.t('publicRecipe.downloadTitle') }}</h3>
                <p>{{ languageStore.t('publicRecipe.downloadDescription') }}</p>
                <v-row class="justify-center mt-3">
                    <v-col cols="6">
                        <v-btn color="white" variant="outlined" prepend-icon="mdi-google-play"
                            @click="openStore('https://play.google.com/store/apps/details?id=de.murmli.twa')">
                            Google Play
                        </v-btn>
                    </v-col>
                    <v-col cols="6">
                        <v-btn color="white" variant="outlined" prepend-icon="mdi-apple"
                            @click="openStore('https://apps.apple.com/app/murmli/idYOUR_APP_ID')">
                            App Store
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card>
        </div>

        <!-- Recipe Content -->
        <div class="recipe-content">
            <!-- Image & Title -->
            <h4 class="text-center mt-4">{{ recipe.title }}</h4>

            <v-card class="mx-auto ma-4" width="100%" max-width="400" height="110" :image="recipe.image" theme="dark">
            </v-card>

            <!-- Servings -->
            <div>
                <h4 class="ma-5 text-center">
                    {{ languageStore.t('recipe.recipeFor') }}
                    {{ recipe.servings }}
                    {{ personText }}
                </h4>
            </div>

            <!-- Preparation -->
            <v-expansion-panels multiple variant="popout">
                <v-expansion-panel value="999">
                    <v-expansion-panel-title>{{ languageStore.t('recipe.prepareIngredients')
                        }}</v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <ul class="pa-3 ml-5">
                            <li v-for="(ingredient, y) in recipe.ingredients" :key="y">
                                <span class="text-capitalize">{{ ingredient.name }}</span>
                                <template v-if="ingredient && ingredient.unit.id != 11">
                                    ({{ ingredient.quantity }} {{ ingredient.unit.name }})
                                </template>
                            </li>
                        </ul>
                    </v-expansion-panel-text>
                </v-expansion-panel>

                <!-- Steps -->
                <v-expansion-panel v-for="(step, i) in recipe.steps" :key="i" :value="i">
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

            <!-- Nutrients -->
            <div>
                <h3 class="ma-5 text-center">{{ languageStore.t('recipe.nutrition.title') }}</h3>
                <v-row class="ma-5 text-center">
                    <v-col class="text-center">
                        <p>{{ languageStore.t('recipe.nutrition.kilocalories') }}</p>
                        <p>{{ recipe.nutrients.kilocalories }}</p>
                    </v-col>
                    <v-col class="text-center">
                        <p>{{ languageStore.t('recipe.nutrition.carbohydrates') }}</p>
                        <p>{{ recipe.nutrients.carbohydrates }}</p>
                    </v-col>
                    <v-col class="text-center">
                        <p>{{ languageStore.t('recipe.nutrition.fat') }}</p>
                        <p>{{ recipe.nutrients.fat }}</p>
                    </v-col>
                    <v-col class="text-center">
                        <p>{{ languageStore.t('recipe.nutrition.protein') }}</p>
                        <p>{{ recipe.nutrients.protein }}</p>
                    </v-col>
                </v-row>
            </div>

            <!-- Information -->
            <div>
                <h3 class="my-5 text-center">{{ languageStore.t('recipe.information.title') }}</h3>
                <v-row class="" width="100%">
                    <v-col class="text-center" cols="6" width="100%">
                        <p>{{ languageStore.t('recipe.information.preparationTime') }}</p>
                        <v-icon icon="mdi-clock-time-four-outline"></v-icon>
                        <p>{{ recipe.preparationTime }} min</p>
                    </v-col>
                    <v-col class="text-center" cols="6" width="100%">
                        <p>{{ languageStore.t('recipe.information.everyday') }}</p>
                        <v-icon icon="mdi-calendar-check"></v-icon>
                        <p>{{ recipe.everydayRating }} / 10</p>
                    </v-col>
                </v-row>

                <v-row class="">
                    <v-col class="text-center">
                        <p>{{ languageStore.t('recipe.information.healthy') }}</p>
                        <v-icon icon="mdi-drama-masks"></v-icon>
                        <p>{{ recipe.healthRating }} / 10</p>
                    </v-col>
                    <v-col class="text-center">
                        <p>{{ languageStore.t('recipe.information.price') }}</p>
                        <v-icon icon="mdi-currency-usd"></v-icon>
                        <p>{{ recipe.priceRating }} / 10</p>
                    </v-col>
                </v-row>

                <v-row class="">
                    <v-col class="text-center">
                        <p>{{ languageStore.t('recipe.information.difficulty') }}</p>
                        <v-icon icon="mdi-chart-areaspline"></v-icon>
                        <p>{{ recipe.difficultyRating }} / 10</p>
                    </v-col>
                    <v-col class="text-center">
                        <p>{{ languageStore.t('recipe.information.sustainability') }}</p>
                        <v-icon icon="mdi-repeat"></v-icon>
                        <p>{{ recipe.sustainabilityRating }} / 10</p>
                    </v-col>
                </v-row>
            </div>
        </div>
    </div>
    <div v-else class="text-center pa-4">
        <v-progress-circular indeterminate></v-progress-circular>
        <p>{{ languageStore.t('publicRecipe.loading') }}</p>
    </div>
</template>

<route lang="yaml">
  meta:
    layout: defaultLayout
    requiresAuth: false
</route>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLanguageStore } from '@/stores/languageStore'
import { CapacitorHttp } from '@capacitor/core'

const route = useRoute()
const languageStore = useLanguageStore()
const recipe = ref(null)

const personText = computed(() => {
    return recipe.value?.servings === 1
        ? languageStore.t('recipe.recipePerson')
        : languageStore.t('recipe.recipePersons')
})

const openStore = (url) => {
    window.open(url, '_blank')
}

const loadRecipe = async () => {
    try {
        const recipeId = route.params.id
        const servings = route.query.servings || 4

        const response = await CapacitorHttp.get({
            url: `${import.meta.env.VITE_API_BASE_URL}/api/v2/recipe/public/${recipeId}?servings=${servings}`,
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if (response.status === 200) {
            recipe.value = response.data
        } else {
            console.error('Failed to load recipe:', response)
        }
    } catch (error) {
        console.error('Error loading recipe:', error)
    }
}

onMounted(() => {
    loadRecipe()
})
</script>

<style scoped>
.public-recipe-page {
    min-height: 100vh;
}

.download-banner {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px 0;
}

.recipe-content {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}
</style>