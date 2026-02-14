<template>
  <v-dialog v-model="notificationStore.isDialogOpen" max-width="400px" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-bell</v-icon>
        {{ getTitle() }}
      </v-card-title>
      <v-card-text>
        {{ getMessage() }}
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text color="primary" @click="handleClose">
          {{ languageStore.t('general.ok') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useNotificationStore } from '@/stores/notificationStore';
import { useLanguageStore } from '@/stores/languageStore';

const notificationStore = useNotificationStore();
const languageStore = useLanguageStore();

const getTitle = () => {
  const msg = notificationStore.currentMessage;
  if (!msg) return '';
  if (msg.title.startsWith('recipeReady') || msg.title.startsWith('trainingPlanReady')) {
    return languageStore.t(`general.notifications.${msg.title}`);
  }
  return msg.title;
};

const getMessage = () => {
  const msg = notificationStore.currentMessage;
  if (!msg) return '';
  if (msg.message.startsWith('recipeReady') || msg.message.startsWith('trainingPlanReady')) {
    return languageStore.t(`general.notifications.${msg.message}`);
  }
  return msg.message;
};

const handleClose = () => {
  notificationStore.closeNotification();
};
</script>
