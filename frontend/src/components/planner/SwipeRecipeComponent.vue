<template>
    <div class="w-100">
        <v-alert v-if="plannerStore.recipeSuggestions.length === 0 && plannerStore.isFetching" type="info"
            class="mt-6 text-center">
            {{ languageStore.t('planner.fetchingMessage') }}
        </v-alert>
        <template v-else>
            <v-carousel height="auto" v-model="currentIndex" hide-delimiters :reverse="true">
                <!-- Items -->
                <v-carousel-item v-for="(item, i) in plannerStore.recipeSuggestions" :key="i">
                    <h4 class="text-center" style="height: 50px;">{{ item.title }}</h4>
                    <v-img class="rounded-lg" :src="item.image" cover></v-img>
                </v-carousel-item>

                <!-- Vote Button -->
                <template v-slot:prev="{ item }">
                    <v-btn color="white" icon="mdi-thumb-down-outline"
                        @click="voteRecipe(plannerStore.recipeSuggestions[currentIndex]?._id, 'downvote')"></v-btn>
                </template>

                <template v-slot:next="{ item }">
                    <v-btn color="white" icon="mdi-thumb-up-outline"
                        @click="voteRecipe(plannerStore.recipeSuggestions[currentIndex]?._id, 'upvote')"></v-btn>
                </template>
            </v-carousel>
            <div class="text-center">
                <v-btn @click="openResetDialog" class="my-5" color="primary">
                    {{ languageStore.t('general.selected') }}
                    {{ plannerStore.selectedRecipeCount }}/{{ plannerStore.filters.recipes }}
                </v-btn>
            </div>
            <v-card>
                <v-card-text>
                    {{ plannerStore.recipeSuggestions[currentIndex]?.description }}
                </v-card-text>
            </v-card>
        </template>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { usePlannerStore } from '@/stores/plannerStore';
import { useRouter } from 'vue-router';
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';

const MIN_RECIPE_SUGGESTIONS = parseInt(import.meta.env.VITE_MIN_RECIPE_SUGGESTIONS) || 5;
const plannerStore = usePlannerStore();
const languageStore = useLanguageStore();
const dialogStore = useDialogStore();
const currentIndex = ref(0);
const router = useRouter();

const votesCompleted = computed(() => plannerStore?.votesCompleted);

const voteRecipe = async (recipeId, voteType) => {
    const vote = await plannerStore.voteRecipe(recipeId, voteType);

    if (vote) {
        // Index anpassen, um Fehler zu vermeiden
        if (currentIndex.value >= plannerStore.recipeSuggestions.length - 1) {
            currentIndex.value = Math.max(0, plannerStore.recipeSuggestions.length - 2);
        }

        // Remove the recipe locally
        plannerStore.removeRecipeSuggestion(recipeId);

        if (vote.type === 'compiled') {
            // Weiterleitung zur Startseite, wenn alle Rezepte verarbeitet sind
            router.push('/');
        } else if (plannerStore.recipeSuggestions.length < MIN_RECIPE_SUGGESTIONS) {
            await plannerStore.fetchRecipeSuggestions(false);
        }
    }
};

const openResetDialog = () => {
    dialogStore.openConfirmDialog(
        languageStore.t('planner.resetSelectionDialog.text'),
        languageStore.t('planner.resetSelectionDialog.dialogMsg'),
        async () => {
            const success = await plannerStore.clearSelectedRecipes();
            if (success) {
                await plannerStore.fetchSelectedRecipeCount(false);
            }
        }
    );
};

// Beim Mounten Vorschläge laden
onMounted(() => {
    const showWelcomeWindow = localStorage.getItem('showPlannerHelpWindow');
    plannerStore.fetchSelectedRecipeCount(false);
    if (plannerStore.recipeSuggestions.length === 0) {
        plannerStore.fetchRecipeSuggestions(!!showWelcomeWindow);
    }
});

// Beobachte, ob alle Votes abgeschlossen sind
watch(votesCompleted, (value) => {
    if (value) {
        // Add custom logic here if needed when all votes are completed
    }
});
</script>
