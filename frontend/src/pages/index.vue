<template>
  <!-- Welcome Window -->
  <WelcomeWindow />

  <!-- Current Shopping List Items -->
  <CurrentItemsComponent />

  <!-- Checked Off Items -->
  <CheckedItemsComponent />

  <!-- Favorite Items for Quick Add -->
  <FavoriteItemsComponent v-if="shoppingListStore.sortedFavorites.length > 0" />

  <!-- Notes Section -->
  <NotesSectionComponent />
</template>

<route lang="yaml">
  meta:
    layout: shoppingListLayout
</route>

<script setup>
// import { useLanguageStore } from '@/stores/languageStore'
// const languageStore = useLanguageStore()

import { onMounted } from 'vue'
import { useShoppingListStore } from '@/stores/shoppingListStore'
const shoppingListStore = useShoppingListStore()

onMounted(async () => {
  await shoppingListStore.initializeShoppingList();
})

// use instead of text output langaugeStore: languageStore.t('shoppinglist.greeting');

</script>