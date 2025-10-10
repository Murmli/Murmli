<template>
  <!-- Planer Help Window -->
  <PlannerHelpWindow />

  <!-- Current Shopping List Items -->
  <SwipeRecipeComponent />
</template>

<route lang="yaml">
  meta:
    layout: plannerLayout
</route>

<script setup>
// import { useLanguageStore } from '@/stores/languageStore'
// const languageStore = useLanguageStore()

// use instead of text output langaugeStore: languageStore.t('shoppinglist.greeting');

</script>