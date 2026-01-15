<template>
  <ChatDialog
    v-model="dialogStore.dialogs.askTrainingPlanDialog"
    :title="languageStore.t('trainingPlans.ask')"
    :placeholder="languageStore.t('trainingPlans.enterQuestion')"
    :empty-state="languageStore.t('trainingPlans.askDialog')"
    :on-send="handleSend"
  />
</template>

<script setup>
import { useDialogStore } from '@/stores/dialogStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useTrainingStore } from '@/stores/trainingStore';
import ChatDialog from './ChatDialog.vue';

const dialogStore = useDialogStore();
const languageStore = useLanguageStore();
const trainingStore = useTrainingStore();

const handleSend = async (message, history) => {
  // history contains the new message as the last element with role 'user'
  // and previous messages. Content is in 'content' field.
  // The backend expects 'messages' array.
  
  // We pass the full history (which includes the latest user message)
  // The ChatDialog pushes the user message to history BEFORE calling onSend
  // So 'history' here is the array of all messages including the new one.
  
  const answer = await trainingStore.askTrainingPlanQuestion(history);
  return { answer };
};
</script>
