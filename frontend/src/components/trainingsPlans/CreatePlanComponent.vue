<template>
        <VoiceInputDialog dialog-key="trainingPlanVoiceDialog" mode="transcribe"
            @completed="applyVoiceInput" />
    <v-dialog v-model="dialogStore.dialogs.createTrainingPlanDialog">
        <v-card>
            <v-card-title>{{ languageStore.t('trainingPlans.help.step1.title') }}</v-card-title>
            <v-card-text>
                <v-textarea v-model="planDescription" clearable
                    :label="languageStore.t('trainingPlans.descriptionLabelCreate')">
                    <template #append-inner>
                        <v-icon @click="openVoiceDialog">mdi-microphone</v-icon>
                    </template>
                </v-textarea>
                <div>
                    <v-expansion-panels>
                        <v-expansion-panel :title="languageStore.t('general.instructions')">
                            <v-expansion-panel-text>
                                <p v-html="languageStore.t('trainingPlans.createPlanInstructions')"> </p>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="closeDialog">{{ languageStore.t('general.cancel') }}</v-btn>
                <v-btn color="primary" @click="confirm" :disabled="isGenerating">{{ languageStore.t('general.confirm') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useTrainingStore } from '@/stores/trainingStore';
import { useDialogStore } from '@/stores/dialogStore';
import { useLanguageStore } from '@/stores/languageStore';
import VoiceInputDialog from '@/components/dialogs/VoiceInputDialog.vue';

const dialogStore = useDialogStore();
const trainingStore = useTrainingStore();
const languageStore = useLanguageStore();

const planDescription = ref('');
const isGenerating = computed(() => trainingStore.generationStatus === 'processing');

const confirm = async () => {
    if (isGenerating.value) {
        alert(languageStore.t('trainingPlans.processingMessage'));
        return;
    }
    const result = await trainingStore.generateTrainingPlan(planDescription.value);
    planDescription.value = '';
    dialogStore.closeDialog('createTrainingPlanDialog');
    if (result && result.status === 'processing') {
        alert(languageStore.t('trainingPlans.processingMessage'));
    } else {
        await trainingStore.fetchTrainingPlans();
        alert(languageStore.t('trainingPlans.readyMessage'));
    }
};

const closeDialog = () => {
    dialogStore.closeDialog('createTrainingPlanDialog');
};

const openVoiceDialog = () => {
    dialogStore.openDialog('trainingPlanVoiceDialog');
};

const applyVoiceInput = ({ text }) => {
    if (!text) {
        return;
    }
    planDescription.value = planDescription.value
        ? `${planDescription.value.trimEnd()}\n${text}`
        : text;
};
</script>
