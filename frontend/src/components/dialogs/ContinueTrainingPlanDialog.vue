<template>
  <v-dialog v-model="dialogStore.dialogs.continueTrainingPlanDialog">
    <v-card>
      <v-card-title>{{ dialogTitle }}</v-card-title>
      <v-card-text>
        <p class="mb-4">{{ languageStore.t('trainingPlans.continuePlanDescription') }}</p>
        <v-textarea
          v-model="additionalNotes"
          clearable
          auto-grow
          :label="languageStore.t('trainingPlans.continuePlanNotesLabel')"
        ></v-textarea>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="closeDialog">{{ languageStore.t('general.cancel') }}</v-btn>
        <v-btn color="primary" :disabled="isGenerating" @click="confirm">
          {{ languageStore.t('trainingPlans.continuePlanAction') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useDialogStore } from '@/stores/dialogStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { useLanguageStore } from '@/stores/languageStore';

const dialogStore = useDialogStore();
const trainingStore = useTrainingStore();
const languageStore = useLanguageStore();

const additionalNotes = ref('');

const isGenerating = computed(() => trainingStore.generationStatus === 'processing');
const currentPlanName = computed(() => trainingStore.selectedPlan?.name || '');

const dialogTitle = computed(() =>
  languageStore
    .t('trainingPlans.continuePlanTitle')
    .replace('{name}', currentPlanName.value)
);

watch(
  () => dialogStore.dialogs.continueTrainingPlanDialog,
  (isOpen) => {
    if (!isOpen) {
      additionalNotes.value = '';
    }
  }
);

const confirm = async () => {
  if (!trainingStore.selectedPlan) {
    return;
  }
  if (isGenerating.value) {
    alert(languageStore.t('trainingPlans.processingMessage'));
    return;
  }
  const result = await trainingStore.continueTrainingPlan(
    trainingStore.selectedPlan,
    additionalNotes.value
  );
  additionalNotes.value = '';
  dialogStore.closeDialog('continueTrainingPlanDialog');
  if (result && result.status === 'processing') {
    alert(languageStore.t('trainingPlans.processingMessage'));
  } else if (result) {
    await trainingStore.fetchTrainingPlans();
    alert(languageStore.t('trainingPlans.readyMessage'));
  }
};

const closeDialog = () => {
  additionalNotes.value = '';
  dialogStore.closeDialog('continueTrainingPlanDialog');
};
</script>

<style scoped>
p {
  white-space: pre-line;
}
</style>
