<template>
  <v-row class="align-center mt-4" no-gutters>
    <v-text-field v-model="userId" :label="languageStore.t('settings.userId')" readonly density="comfortable"
      hide-details></v-text-field>
    <v-btn icon="mdi-content-copy" @click="copyId" class="ml-2" :aria-label="languageStore.t('settings.copy')">
      <v-icon>mdi-content-copy</v-icon>
    </v-btn>
  </v-row>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useLanguageStore } from '@/stores/languageStore';

const userStore = useUserStore();
const languageStore = useLanguageStore();

const userId = ref('');

onMounted(async () => {
  if (!userStore.id) {
    await userStore.fetchUserId();
  }
  userId.value = userStore.id;
});

const copyId = async () => {
  try {
    await navigator.clipboard.writeText(userId.value);
    alert(languageStore.t('settings.copySuccess'));
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};
</script>
