<template>
    <div class="w-100">
        <v-card class="mx-auto my-4 mt-10" max-width="600">
            <v-card-title>{{ languageStore.t('shoppingList.favorites') }}</v-card-title>
            <v-card-text>
                <div>
                    <v-chip v-for="favorite in favorites" :key="favorite.name" class="ma-1" color="primary"
                        @click="addFavoriteToTracker(favorite)">
                        {{ favorite.name }}
                    </v-chip>
                </div>
            </v-card-text>
        </v-card>
    </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useTrackerStore } from '@/stores/trackerStore';
import { useLanguageStore } from '@/stores/languageStore';
import { storeToRefs } from 'pinia';

const trackerStore = useTrackerStore();
const languageStore = useLanguageStore();

// Favoriten als computed property verwenden, um automatische Aktualisierungen zu erhalten
// Mit storeToRefs wird eine reaktive Referenz auf die Store-Eigenschaft erstellt
const { favorites: storeFavorites } = storeToRefs(trackerStore);

// Favoriten als computed property, die auf Änderungen im Store reagiert
const favorites = computed(() => {
    return [...storeFavorites.value].sort((a, b) => a.name.localeCompare(b.name));
});

// Favoriten beim Mounten laden
onMounted(() => {
    trackerStore.loadFavoritesFromLocalStorage();
});
const addFavoriteToTracker = async (favorite) => {
    // Use direct add method to preserve exact nutritional values
    await trackerStore.addFoodItemDirect(favorite);
};
</script>
