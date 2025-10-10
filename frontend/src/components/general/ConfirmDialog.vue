<template>
  <v-dialog v-model="dialog.open" max-width="400px">
    <v-card>
      <v-card-title>{{ dialog.title }}</v-card-title>
      <v-card-text>
        <div v-html="dialog.text"></div>
      </v-card-text>
      <v-card-actions>
        <v-btn text @click="close">{{ languageStore.t('general.cancel') }}</v-btn>
        <v-btn text color="primary" @click="confirm">{{ languageStore.t('general.confirm') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useDialogStore } from '@/stores/dialogStore';
import { useLanguageStore } from '@/stores/languageStore';
import { computed } from 'vue';

const languageStore = useLanguageStore();

const dialogStore = useDialogStore();
const dialog = computed(() => dialogStore.dialogs.confirmDialog);

const close = () => dialogStore.closeConfirmDialog();
const confirm = () => dialogStore.confirmAction();
</script>

<!-- USAGE -->

<!--

  dialogStore.openConfirmDialog(
    languageStore.t('shoppingList.deleteList.title'),
    languageStore.t('shoppingList.deleteList.dialogMsg'),
    () => {
      // Hier die Logik zum Leeren der Liste einfügen
    }
  );
  
  -->