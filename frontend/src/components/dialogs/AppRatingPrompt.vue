<template>
  <v-bottom-sheet v-model="dialogStore.dialogs.appRatingPrompt">
    <v-card class="text-center pa-4 rounded-t-xl">
      <div class="d-flex justify-center mb-4">
        <v-avatar color="primary-lighten-4" size="64">
          <v-icon color="primary" size="32">mdi-star-face</v-icon>
        </v-avatar>
      </div>
      
      <v-card-title class="text-h5 justify-center flex-wrap pb-2">
        {{ languageStore.t('appRating.title') }}
      </v-card-title>
      
      <v-card-text class="text-body-1 pb-4">
        {{ languageStore.t('appRating.description') }}
      </v-card-text>
      
      <v-card-actions class="flex-column ga-2 px-0">
        <v-btn
          block
          color="primary"
          variant="elevated"
          size="large"
          prepend-icon="mdi-star"
          class="text-none font-weight-bold"
          @click="rateNow"
        >
          {{ languageStore.t('appRating.rateNow') }}
        </v-btn>
        <v-btn
          block
          variant="text"
          class="text-none"
          @click="close"
        >
          {{ languageStore.t('appRating.remindLater') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-bottom-sheet>
</template>

<script setup>
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';
import { Capacitor } from '@capacitor/core';
import { delayRatingPrompt } from '@/utils/appRating';

const languageStore = useLanguageStore();
const dialogStore = useDialogStore();

const rateNow = () => {
  // Pausiert den Dialog für die nächsten 500 Besuche
  delayRatingPrompt();
  
  const platform = Capacitor.getPlatform();
  let url = 'https://play.google.com/store/apps/details?id=de.murmli.twa';
  
  if (platform === 'ios') {
    url = 'https://apps.apple.com/us/app/murmli/id6753867833';
  }
  
  window.open(url, '_blank');
  dialogStore.closeDialog('appRatingPrompt');
};

const close = () => {
  dialogStore.closeDialog('appRatingPrompt');
};
</script>

<style scoped>
.v-card {
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}
</style>
