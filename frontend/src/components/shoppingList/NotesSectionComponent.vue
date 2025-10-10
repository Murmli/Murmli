<template>
    <v-card class="pa-4" width="100%">
        <v-textarea v-model="note" :label="languageStore.t('shoppingList.notesLabel')" outlined
            :hint="languageStore.t('shoppingList.notesHint')" clearable />
    </v-card>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useLanguageStore } from '@/stores/languageStore'

// Initialisieren des LanguageStores für die Lokalisierung
const languageStore = useLanguageStore()

// Initialisieren einer Referenz für die Notizen
const note = ref('')

// Laden der Notiz aus dem Local Storage bei Komponent-Mount
onMounted(() => {
    note.value = localStorage.getItem('note') || ''
})

// Speichern der Notiz im Local Storage bei jeder Änderung
watch(note, (newNote) => {
    localStorage.setItem('note', newNote)
})
</script>

<style scoped>
/* Optional: Stil für das Notizfeld */
.pa-4 {
    padding: 16px;
}
</style>