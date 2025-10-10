<template>
    <div class="w-100">
        <v-card class="mx-auto my-4" max-width="600">
            <v-card-title>{{ languageStore.t('shoppingList.favorites') }}</v-card-title>
            <v-card-text>
                <div>
                    <v-chip v-for="favorite in favorites" :key="favorite.name" class="ma-1"
                        :color="isActiveOnShoppingList(favorite) ? 'primary' : 'grey'"
                        :outlined="!isActiveOnShoppingList(favorite)"
                        :append-icon="isActiveOnShoppingList(favorite) ? 'mdi-check' : ''"
                        @click="toggleFavoriteStatus(favorite)">
                        {{ favorite.name }}
                    </v-chip>
                </div>
            </v-card-text>
        </v-card>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { useLanguageStore } from '@/stores/languageStore';

const shoppingListStore = useShoppingListStore();
const languageStore = useLanguageStore();

// Favoriten dynamisch aus dem Store beziehen
const favorites = computed(() => shoppingListStore.sortedFavorites);
// Prüfen, ob ein Favorit aktiv auf der Einkaufsliste ist
const isActiveOnShoppingList = (favorite) => {
    return shoppingListStore.items.some(
        (item) => item.name === favorite.name && item.active
    );
};

// Favorit zur Einkaufsliste hinzufügen oder aktiv setzen
const toggleFavoriteStatus = (favorite) => {
    shoppingListStore.addFavoriteToShoppingList(favorite);
};
</script>