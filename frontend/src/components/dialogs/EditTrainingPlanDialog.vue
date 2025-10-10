<template>
    <v-dialog v-model="dialogStore.dialogs.editTrainingPlanDialog" fullscreen>
        <v-card>
            <v-toolbar color="primary" class="pt-5">
                <v-btn icon @click="closeDialog">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <v-toolbar-title>{{ languageStore.t('trainingPlans.editPlan') }}</v-toolbar-title>
            </v-toolbar>

            <v-card-text class="pa-4" v-if="trainingPlan">
                <div>
                    <div class="text-center">
                        <p><strong> {{ trainingPlan.name }}</strong></p>
                        <p> {{ trainingPlan.type }}</p>
                        <p>{{ languageStore.t('general.difficulty') }} {{ trainingPlan.difficulty }}/5
                        </p>
                        <p><strong>{{ languageStore.t('general.goal') }}:</strong> {{ trainingPlan.goal }}</p>
                        <p><strong>{{ languageStore.t('trainingPlans.durationWeeks') }}:</strong> {{
                            trainingPlan.durationWeeks }}</p>
                    </div>

                    <v-expansion-panels variant="accordion" multiple class="mt-4">
                        <v-expansion-panel v-for="(day, dayIndex) in trainingPlan.days" :key="dayIndex">
                            <v-expansion-panel-title>
                                {{ languageStore.t('general.weekdays.' + day.weekday) }}
                            </v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <v-list>
                                    <v-list-item v-for="(exercise, exIndex) in day.exercises" :key="exIndex">
                                        <v-list-item-title
                                            class="exercise-title d-flex align-center justify-space-between">
                                            <span class="exercise-name">{{ exercise.name }}</span>
                                            <v-icon small class="ml-1" v-if="exercise.instructions"
                                                @click="showInstructions(exercise)">mdi-information-outline</v-icon>
                                        </v-list-item-title>
                                        <v-list-item-subtitle>
                                            {{ languageStore.t('trainingPlans.sets') }}: {{ exercise.sets }}
                                            <template v-if="exercise.repetitions !== undefined">
                                                x {{ exercise.repetitions }}
                                                {{ languageStore.t('trainingPlans.repetitionsShort') }}
                                            </template>
                                        </v-list-item-subtitle>

                                        <v-list-item-subtitle v-if="exercise.duration != null">
                                            {{ languageStore.t('trainingPlans.suggestedDuration') }}:
                                            {{ exercise.duration }}s
                                        </v-list-item-subtitle>

                                        <v-list-item-subtitle>
                                            {{ languageStore.t('trainingPlans.restBetweenSets') }}:
                                            {{ exercise.restBetweenSets }}s
                                        </v-list-item-subtitle>

                                        <v-list-item-subtitle v-if="exercise.suggestedWeight != null">
                                            {{ languageStore.t('trainingPlans.suggestedWeight') }}:
                                            {{ exercise.suggestedWeight }} kg
                                        </v-list-item-subtitle>

                                        <v-list-item-subtitle>
                                            {{ languageStore.t('trainingPlans.restAfterExercise') }}:
                                            {{ exercise.restAfterExercise }}s
                                        </v-list-item-subtitle>
                                    </v-list-item>
                                </v-list>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </div>

                <!-- Edit Form -->
                <template v-if="!previewData">
                    <v-textarea class="mt-6" v-model="text"
                        :label="languageStore.t('trainingPlans.editPlanDescription')" outlined rows="5"
                        auto-grow></v-textarea>
                    <v-alert v-if="errorMessage" type="error" class="mt-2">
                        {{ errorMessage }}
                    </v-alert>
                    <v-btn color="primary" block :loading="loading" @click="generatePreview">
                        {{ languageStore.t('trainingPlans.editDialog.preview') }}
                    </v-btn>
                </template>
                <template v-else>
                    <v-alert v-if="errorMessage" type="error" class="mt-2">
                        {{ errorMessage }}
                    </v-alert>
                </template>
                <v-card v-if="previewData" class="mt-6" outlined>
                    <v-card-title class="text-h6">
                        {{ languageStore.t('trainingPlans.editDialog.changes') }}
                    </v-card-title>
                    <v-card-text>
                        <v-list density="compact">
                            <v-list-item v-for="(change, idx) in previewData.changes" :key="idx">
                                <template v-slot:prepend>
                                    <v-icon color="primary">mdi-check-circle-outline</v-icon>
                                </template>
                                <v-list-item-title class="change-item">{{ change }}</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
                <v-btn v-if="previewData" color="primary" block :loading="loading" class="mt-4" @click="applyEdit">
                    {{ languageStore.t('trainingPlans.editDialog.save') }}
                </v-btn>

                <!-- Info Field -->
                <h3 class="pt-5"></h3>
                <v-alert class="mb-4" :title="languageStore.t('training.description')">
                    <p class="mt-1">{{ trainingPlan.notes }}</p>
                </v-alert>

            </v-card-text>
        </v-card>
    </v-dialog>

    <!-- Instruction Dialog -->
    <v-dialog v-model="showInstructionDialog" max-width="500px">
        <v-card>
            <v-card-title class="headline">{{ currentExerciseName }}</v-card-title>
            <v-card-text>
                {{ currentInstruction }}
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" text @click="showInstructionDialog = false">
                    {{ languageStore.t('general.close') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useDialogStore } from '@/stores/dialogStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useTrainingStore } from '@/stores/trainingStore';

const dialogStore = useDialogStore();
const languageStore = useLanguageStore();
const trainingStore = useTrainingStore();

const trainingPlan = ref(null);
const trainingPlanId = ref(null);
const text = ref('');
const previewData = ref(null);
const loading = ref(false);
const errorMessage = ref('');

const showInstructionDialog = ref(false);
const currentInstruction = ref('');
const currentExerciseName = ref('');

watch(() => dialogStore.dialogs.editTrainingPlanDialog, (newValue) => {
    if (newValue) {
        const selected = trainingStore.selectedPlan;
        trainingPlan.value = JSON.parse(JSON.stringify(selected));
        trainingPlanId.value = selected?._id || null;
        previewData.value = null;
        text.value = '';
    }
});

const showInstructions = (exercise) => {
    currentInstruction.value = exercise.instructions;
    currentExerciseName.value = exercise.name;
    showInstructionDialog.value = true;
};

const closeDialog = () => {
    dialogStore.closeDialog('editTrainingPlanDialog');
};

const generatePreview = async () => {
    loading.value = true;
    errorMessage.value = '';
    try {
        const result = await trainingStore.editTrainingPlanWithText(trainingPlanId.value, text.value, true);
        if (result && result.preview) {
            previewData.value = result;
            trainingPlan.value = result.preview;
        }
    } catch (error) {
        errorMessage.value = languageStore.t('general.errorOccurred');
    } finally {
        loading.value = false;
    }
};

const applyEdit = async () => {
    if (!previewData.value) return;
    loading.value = true;
    errorMessage.value = '';
    try {
        const { _id, ...planData } = trainingPlan.value || {};
        await trainingStore.editTrainingPlanWithText(
            trainingPlanId.value,
            '',
            false,
            planData
        );
        text.value = '';
        previewData.value = null;
        closeDialog();
    } catch (error) {
        errorMessage.value = languageStore.t('general.errorOccurred');
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.exercise-title {
    white-space: normal;
    word-break: break-word;
    overflow: visible;
}

.exercise-name {
    overflow-wrap: anywhere;
}

.change-item {
    white-space: pre-line;
    overflow: visible;
    text-overflow: unset;
}
</style>
