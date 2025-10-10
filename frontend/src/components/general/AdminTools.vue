<template>
  <div class="d-flex flex-column align-center w-100">
    <v-btn
      class="mb-2 w-100"
      :color="clearConfirm > 0 ? 'error' : 'primary'"
      @click="clearCache"
    >
      {{
        clearConfirm > 0
          ? languageStore
              .t('adminTools.confirm')
              .replace('{seconds}', clearConfirm)
          : languageStore.t('adminTools.clearCache')
      }}
    </v-btn>
    <v-btn
      class="mb-2 w-100"
      :color="imageConfirm > 0 ? 'error' : 'primary'"
      @click="resetImages"
    >
      {{
        imageConfirm > 0
          ? languageStore
              .t('adminTools.confirm')
              .replace('{seconds}', imageConfirm)
          : languageStore.t('adminTools.resetImages')
      }}
    </v-btn>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useApiStore } from '@/stores/apiStore';
import { useLanguageStore } from '@/stores/languageStore';

const apiStore = useApiStore();
const languageStore = useLanguageStore();

const clearConfirm = ref(0);
let clearTimer;
const clearCache = async () => {
  if (clearConfirm.value === 0) {
    clearConfirm.value = 3;
    clearTimer = setInterval(() => {
      clearConfirm.value--;
      if (clearConfirm.value === 0) clearInterval(clearTimer);
    }, 1000);
    return;
  }
  clearInterval(clearTimer);
  clearConfirm.value = 0;
  const response = await apiStore.apiRequest('delete', '/system/llm/cache');
  if (response && response.status === 200) {
    alert(languageStore.t('adminTools.success'));
  }
};

const imageConfirm = ref(0);
let imageTimer;
const resetImages = async () => {
  if (imageConfirm.value === 0) {
    imageConfirm.value = 3;
    imageTimer = setInterval(() => {
      imageConfirm.value--;
      if (imageConfirm.value === 0) clearInterval(imageTimer);
    }, 1000);
    return;
  }
  clearInterval(imageTimer);
  imageConfirm.value = 0;
  const response = await apiStore.apiRequest('delete', '/system/exercise-images/reset');
  if (response && response.status === 200) {
    alert(languageStore.t('adminTools.success'));
  }
};

</script>

