<template>
  <div class="d-flex flex-column align-center w-100">
    <v-btn
      class="mb-4 w-100"
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
      class="mb-6 w-100"
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

    <v-btn
      class="mb-6 w-100"
      color="secondary"
      variant="outlined"
      prepend-icon="mdi-star-circle"
      @click="forceShowRatingPrompt"
    >
      {{ languageStore.t('adminTools.forceRatingPrompt') }}
    </v-btn>

    <v-divider class="mb-6 w-100"></v-divider>

    <h3 class="mb-4">{{ languageStore.t('adminTools.systemMessageTitle') }}</h3>
    
    <v-text-field
      v-model="adminMessageTitle"
      :label="languageStore.t('adminTools.messageTitleLabel')"
      class="w-100 mb-2"
      variant="outlined"
      hide-details
    ></v-text-field>

    <v-textarea
      v-model="adminMessageContent"
      :label="languageStore.t('adminTools.messageContentLabel')"
      class="w-100 mb-4"
      variant="outlined"
      rows="4"
      hide-details
    ></v-textarea>

    <div class="d-flex w-100 gap-2 mb-4">
      <v-btn
        color="secondary"
        @click="correctGrammar"
        :loading="loadingGrammar"
        class="flex-grow-1"
        prepend-icon="mdi-auto-fix"
      >
        {{ languageStore.t('adminTools.correctGrammar') }}
      </v-btn>
    </div>

    <v-btn
      color="error"
      @click="confirmSend"
      :loading="loadingSend"
      class="w-100"
      prepend-icon="mdi-send"
      :disabled="!adminMessageTitle || !adminMessageContent"
    >
      {{ languageStore.t('adminTools.sendGlobalMessage') }}
    </v-btn>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useApiStore } from '@/stores/apiStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';
import { forceShowRatingPrompt } from '@/utils/appRating';

const apiStore = useApiStore();
const languageStore = useLanguageStore();
const dialogStore = useDialogStore();

const adminMessageTitle = ref('');
const adminMessageContent = ref('');
const loadingGrammar = ref(false);
const loadingSend = ref(false);

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

const correctGrammar = async () => {
  if (!adminMessageContent.value) return;
  loadingGrammar.value = true;
  try {
    const response = await apiStore.apiRequest('post', '/messages/admin/correct-grammar', {
      text: adminMessageContent.value
    });
    if (response && response.data && response.data.correctedText) {
      adminMessageContent.value = response.data.correctedText;
    }
  } catch (err) {
    console.error('Grammar correction failed:', err);
  } finally {
    loadingGrammar.value = false;
  }
};

const confirmSend = () => {
  dialogStore.openConfirmDialog(
    languageStore.t('adminTools.confirmSendTitle'),
    languageStore.t('adminTools.confirmSendText'),
    () => {
      sendSystemMessage();
    }
  );
};

const sendSystemMessage = async () => {
  loadingSend.value = true;
  try {
    const response = await apiStore.apiRequest('post', '/messages/admin/create-system-message', {
      title: adminMessageTitle.value,
      message: adminMessageContent.value
    });
    if (response && response.status === 201) {
      adminMessageTitle.value = '';
      adminMessageContent.value = '';
      alert(languageStore.t('adminTools.sendSuccess'));
    }
  } catch (err) {
    console.error('Failed to send system message:', err);
  } finally {
    loadingSend.value = false;
  }
};

</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>

