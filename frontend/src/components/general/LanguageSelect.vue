<template>
    <v-select class="mt-4" v-model="selectedLanguage" :items="languageOptions" item-title="text" item-value="value"
        :label="languageStore.t('help.shoppinglist.selectLanguage')" @update:modelValue="setLanguage">
    </v-select>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useShoppingListStore } from '@/stores/shoppingListStore';

const languageStore = useLanguageStore();
const userStore = useUserStore();
const shoppingListStore = useShoppingListStore();

const selectedLanguage = ref(null); // Wird in onMounted gesetzt

// Optionen für das Dropdown-Menü (ohne Codes)
const languageOptions = computed(() =>
    languageStore.languages.map(lang => ({
        text: lang.text, // Zeige nur den Namen der Sprache
        value: lang.value
    }))
);

const setLanguage = async (locale) => {
    await userStore.setLanguage(locale);
    await shoppingListStore.readShoppingList();
};

onMounted(async () => {
    await userStore.fetchLanguage();
    const userLang = userStore.language;

    // Prüfen, ob die Benutzersprache gültig ist
    const isValidUserLang = userLang && languageStore.languages.find(lang => lang.value === userLang);
    if (isValidUserLang) {
        selectedLanguage.value = userLang;
    } else {
        // Fallback auf System-Sprache oder 'en'
        const systemLanguage = navigator.language || 'en';
        const isValidSystemLang = languageStore.languages.find(lang => lang.value === systemLanguage);
        selectedLanguage.value = isValidSystemLang ? systemLanguage : 'en';
    }
});
</script>
