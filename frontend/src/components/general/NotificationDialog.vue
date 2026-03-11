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
  const translated = languageStore.t(`general.notifications.${msg.title}`);
  // If translation returns the key itself, it might not exist in notifications
  if (translated === `general.notifications.${msg.title}`) {
    return languageStore.t(msg.title);
  }
  return translated;
};

const getMessage = () => {
  const msg = notificationStore.currentMessage;
  if (!msg) return '';
  const translated = languageStore.t(`general.notifications.${msg.message}`);
  if (translated === `general.notifications.${msg.message}`) {
    return languageStore.t(msg.message);
  }
  return translated;
};

const handleClose = () => {
  notificationStore.closeNotification();
};
</script>
