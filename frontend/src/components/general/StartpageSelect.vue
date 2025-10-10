<template>
    <v-select v-model="selectedStartpage" :items="startpageOptions" item-title="text" item-value="value" :label="label"
        @update:modelValue="updateStartpage">
    </v-select>
</template>

<script setup>
import { ref } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useLanguageStore } from '@/stores/languageStore';

const languageStore = useLanguageStore();
// Initialize the startpage store
const userStore = useUserStore();

// Options for the start pages
const startpageOptions = [
    { text: languageStore.t('navigation.shoppingList'), value: '/' },
    { text: languageStore.t('navigation.calorieCounter'), value: '/tracker' },
    { text: languageStore.t('trainingPlans.title'), value: '/trainingPlans' },
];

// Label for the select component
const label = languageStore.t('settings.selectStartpage');  //'Startseite auswählen';

// Reactive variable for the selected start page, initial value from the store
const selectedStartpage = ref(userStore.getStartpage());

// Update start page selection and persist the change via the store
const updateStartpage = (value) => {
    userStore.setStartpage(value);
    selectedStartpage.value = value;
};
</script>
